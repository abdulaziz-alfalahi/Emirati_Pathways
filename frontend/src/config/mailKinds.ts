/**
 * What each kind of outbound message is CALLED.
 *
 * English comes from the backend register (`services/mail_templates.TEMPLATES`),
 * which sends `kind_label` alongside the rows; this file supplies Arabic and the
 * fallback. Two screens show message kinds — the wording-approval screen and the
 * review queue — and before this they disagreed: one had names for three of the
 * six kinds, and the other printed the raw database value under every recipient.
 *
 * That is the same defect the role labels had on 2026-08-27, one layer along.
 * One registry, both screens.
 */
const KIND_LABELS_AR: Record<string, string> = {
    seeker_invitation: 'دعوة مرشح (باحث نافس)',
    company_invitation: 'دعوة جهة عمل (رابط مباشر)',
    vacancy_verification: 'التحقق من شاغر (استيراد نافس)',
    team_invitation: 'دعوة زميل (يرسلها مسؤول جهة العمل)',
    staff_invitation: 'دعوة موظفي المنصة',
    board_office_notice: 'إشعار اجتماع المجلس إلى مكتب العضو',
};

/** English fallback for when the caller has no `kind_label` from the server. */
const KIND_LABELS_EN: Record<string, string> = {
    seeker_invitation: 'Candidate invitation (NAFIS seeker)',
    company_invitation: 'Employer invitation (magic link)',
    vacancy_verification: 'Vacancy verification (NAFIS import)',
    team_invitation: 'Colleague invitation (sent by an employer admin)',
    staff_invitation: 'Platform staff invitation',
    board_office_notice: "Board meeting notice to a member's office",
};

/**
 * A readable name for a message kind — never the raw identifier.
 *
 * `serverLabel` wins when present: the backend register is the source, and a
 * kind added there should not need this file edited to stop showing as
 * `some_new_kind` on a government screen.
 */
export const mailKindLabel = (
    kind: string,
    isAr: boolean,
    serverLabel?: string | null,
): string => {
    if (isAr) return KIND_LABELS_AR[kind] || serverLabel || kind;
    return serverLabel || KIND_LABELS_EN[kind] || kind;
};

export { KIND_LABELS_AR, KIND_LABELS_EN };
