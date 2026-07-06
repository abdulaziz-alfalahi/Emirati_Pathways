"""
UAE Pass OAuth 2.0 / OIDC Integration Module
=============================================
Implements the Authorization Code flow for UAE Pass authentication.
Use Case: UC 1.3.1 — New User Registration Only

Endpoints used:
  - Authorization: {base}/authorize
  - Token:         {base}/token
  - UserInfo:      {base}/userinfo
  - Logout:        {base}/logout

References:
  - https://docs.uaepass.ae/
  - https://docs.uaepass.ae/guides/authentication/web-application
"""

import os
import logging
import secrets
import requests
from urllib.parse import urlencode
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)


class UAEPassConfig:
    """UAE Pass environment configuration."""

    def __init__(self):
        self.client_id = os.getenv('UAEPASS_CLIENT_ID', 'sandbox_stage')
        self.client_secret = os.getenv('UAEPASS_CLIENT_SECRET', 'sandbox_stage')
        self.redirect_uri = os.getenv(
            'UAEPASS_REDIRECT_URI',
            'http://localhost:5005/api/auth/uaepass/callback'
        )

        # Determine environment
        env = os.getenv('UAEPASS_ENV', 'staging')  # 'staging' or 'production'

        if env == 'production':
            self.base_url = 'https://id.uaepass.ae'
            self.token_url = 'https://id.uaepass.ae/idp/token'
            self.userinfo_url = 'https://id.uaepass.ae/idp/userinfo'
            self.authorize_url = 'https://id.uaepass.ae/idp/authorize'
            self.logout_url = 'https://id.uaepass.ae/idp/logout'
        else:
            # Staging / sandbox — MUST use /idshub/ paths (not /idp/)
            self.base_url = 'https://stg-id.uaepass.ae'
            self.token_url = 'https://stg-id.uaepass.ae/idshub/token'
            self.userinfo_url = 'https://stg-id.uaepass.ae/idshub/userinfo'
            self.authorize_url = 'https://stg-id.uaepass.ae/idshub/authorize'
            self.logout_url = 'https://stg-id.uaepass.ae/idshub/logout'

        self.scope = os.getenv('UAEPASS_SCOPE', 'openid urn:uae:digitalid:profile:general')
        self.response_type = 'code'
        self.acr_values = 'urn:safelayer:tws:policies:authentication:level:low'

        logger.info(
            f"UAE Pass config loaded: env={env}, "
            f"client_id={self.client_id[:8]}..., "
            f"redirect_uri={self.redirect_uri}"
        )


class UAEPassOAuth:
    """
    Handles the UAE Pass OAuth 2.0 Authorization Code flow.

    Usage:
        oauth = UAEPassOAuth()

        # Step 1: Generate authorization URL
        auth_url, state = oauth.get_authorization_url()
        # → redirect user to auth_url

        # Step 2: Handle callback (after user authenticates)
        tokens = oauth.exchange_code_for_tokens(authorization_code)

        # Step 3: Fetch user profile
        profile = oauth.fetch_user_profile(tokens['access_token'])
    """

    def __init__(self, config: Optional[UAEPassConfig] = None):
        self.config = config or UAEPassConfig()

    def get_authorization_url(self, state: Optional[str] = None, nonce: Optional[str] = None) -> Tuple[str, str, str]:
        """
        Build the UAE Pass authorization URL.
        """
        if not state:
            state = secrets.token_urlsafe(32)
        if not nonce:
            nonce = secrets.token_urlsafe(32)

        params = {
            'response_type': self.config.response_type,
            'client_id': self.config.client_id,
            'scope': self.config.scope,
            'redirect_uri': self.config.redirect_uri,
            'state': state,
            'nonce': nonce,
            'acr_values': self.config.acr_values,
        }

        auth_url = f"{self.config.authorize_url}?{urlencode(params)}"
        logger.info(f"Generated UAE Pass auth URL with state={state[:8]}... and nonce={nonce[:8]}...")
        return auth_url, state, nonce

    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token and ID token.

        Args:
            code: Authorization code from UAE Pass callback

        Returns:
            Dict with access_token, id_token, token_type, expires_in

        Raises:
            UAEPassError on failure
        """
        payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.config.redirect_uri,
            'client_id': self.config.client_id,
            'client_secret': self.config.client_secret,
        }

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        try:
            logger.info("Exchanging authorization code for tokens...")
            response = requests.post(
                self.config.token_url,
                data=payload,
                headers=headers,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(
                    f"Token exchange failed: HTTP {response.status_code} — "
                    f"{response.text[:500]}"
                )
                raise UAEPassError(
                    f"Token exchange failed with status {response.status_code}",
                    status_code=response.status_code,
                    response_body=response.text
                )

            token_data = response.json()
            logger.info("Token exchange successful")
            return token_data

        except requests.RequestException as e:
            logger.error(f"Token exchange request failed: {e}")
            raise UAEPassError(f"Network error during token exchange: {e}")

    def fetch_user_profile(self, access_token: str) -> Dict[str, Any]:
        """
        Fetch user profile from UAE Pass /userinfo endpoint.

        Args:
            access_token: Valid access token from token exchange

        Returns:
            Dict with user attributes:
                uuid, idn, fullnameEN, fullnameAR, email, mobile,
                gender, nationalityEN, nationalityAR, userType,
                idType, titleEN, etc.

        Raises:
            UAEPassError on failure
        """
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        try:
            logger.info("Fetching user profile from UAE Pass...")
            response = requests.get(
                self.config.userinfo_url,
                headers=headers,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(
                    f"UserInfo fetch failed: HTTP {response.status_code} — "
                    f"{response.text[:500]}"
                )
                raise UAEPassError(
                    f"UserInfo fetch failed with status {response.status_code}",
                    status_code=response.status_code,
                    response_body=response.text
                )

            profile = response.json()
            logger.info(
                f"UAE Pass profile fetched: uuid={profile.get('uuid', 'N/A')}, "
                f"name={profile.get('fullnameEN', 'N/A')}"
            )
            return profile

        except requests.RequestException as e:
            logger.error(f"UserInfo request failed: {e}")
            raise UAEPassError(f"Network error fetching user profile: {e}")

    def get_logout_url(self, redirect_url: Optional[str] = None) -> str:
        """
        Build the UAE Pass logout URL.

        Args:
            redirect_url: URL to redirect to after logout

        Returns:
            UAE Pass logout URL
        """
        params = {}
        if redirect_url:
            params['redirect_uri'] = redirect_url

        if params:
            return f"{self.config.logout_url}?{urlencode(params)}"
        return self.config.logout_url

    @staticmethod
    def normalize_profile(raw_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize UAE Pass profile attributes to our internal schema.

        Maps UAE Pass attribute names → platform column names.

        Args:
            raw_profile: Raw response from /userinfo endpoint

        Returns:
            Dict ready for database insertion/update
        """
        # Split fullnameEN into first_name / last_name
        full_name_en = raw_profile.get('fullnameEN', '') or ''
        name_parts = full_name_en.strip().split(None, 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        return {
            'uaepass_uuid': raw_profile.get('uuid'),
            'first_name': first_name,
            'last_name': last_name,
            'full_name': full_name_en,
            'fullname_ar': raw_profile.get('fullnameAR'),
            'email': raw_profile.get('email', ''),
            'phone': raw_profile.get('mobile', ''),
            'emirates_id': raw_profile.get('idn', ''),  # Will be encrypted before storage
            'nationality': raw_profile.get('nationalityEN', 'UAE'),
            'nationality_ar': raw_profile.get('nationalityAR'),
            'gender': raw_profile.get('gender'),
            'id_type': raw_profile.get('idType'),
            'uaepass_usertype': raw_profile.get('userType'),
            'title_en': raw_profile.get('titleEN'),
            'auth_method': 'uaepass',
        }

    def verify_id_token(self, id_token: str, expected_nonce: str) -> Dict[str, Any]:
        """
        Verify the id_token signature, audience, issuer, and nonce.
        """
        import jwt
        from jwt import PyJWKClient
        
        env = os.getenv('UAEPASS_ENV', 'staging')
        expected_iss = 'https://id.uaepass.ae' if env == 'production' else 'https://stg-id.uaepass.ae'
        
        jwks_uri = f"{self.config.base_url}/idshub/keys" if env != 'production' else f"{self.config.base_url}/idp/keys"
        
        try:
            jwk_client = PyJWKClient(jwks_uri)
            signing_key = jwk_client.get_signing_key_from_jwt(id_token)
            
            decoded_claims = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.config.client_id,
                issuer=expected_iss,
                options={"verify_signature": True}
            )
            
            nonce_in_token = decoded_claims.get('nonce')
            if not nonce_in_token or nonce_in_token != expected_nonce:
                raise UAEPassError(f"OIDC ID Token nonce mismatch. Expected {expected_nonce}, got {nonce_in_token}")
                
            return decoded_claims
            
        except jwt.PyJWTError as e:
            logger.error(f"JWT decode error: {e}")
            raise UAEPassError(f"OIDC ID Token validation failed: {e}")


class UAEPassError(Exception):
    """Custom exception for UAE Pass OAuth errors."""

    def __init__(self, message: str, status_code: int = 0, response_body: str = ''):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body
