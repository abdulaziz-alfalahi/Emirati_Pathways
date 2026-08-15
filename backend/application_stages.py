"""
The one stage ladder an application moves along.

WHY THIS MODULE EXISTS (#410, fb_1786434633_280465f2)

Before this, the platform held three overlapping vocabularies and none agreed:

  job_applications.status   submitted · under_review · shortlisted · interview ·
                            offer · accepted · interview_scheduled · offered ·
                            rejected · withdrawn
  applications_api._VALID_STATUSES
                            submitted · under_review · shortlisted · interview ·
                            offer · hired · rejected · withdrawn
  event_outcomes.stage      shortlisted · interviewed · offered · placed · rejected

The API's own validation set did not contain three values its own code wrote
('accepted', 'interview_scheduled', 'offered'), so a status could be written
that the endpoint validating statuses would have rejected. `event_outcomes` was
deliberately given its names FOR the shared-pipeline request — its migration
says so — but nothing brought the application pipeline into line.

Adding the employer pipeline on top of that would have made a fourth. So the
ladder is settled here first, while it is cheap: 9 application rows and 0
outcome rows exist. After launch this is a data migration with live employers
watching.

TWO NAMING DECISIONS, both from the owner:
  • "Hired" and "Placed" are the SAME stage. One name — `placed` — because two
    names for one thing is how a pipeline stops being countable.
  • "Request a secondary interview" is NOT a stage. It is a return to
    `interview_scheduled` with a higher round number. As a stage it would put
    the pipeline in a position that cannot be ordered.

ONE DEVIATION from the ladder as scoped in #410, stated rather than slipped in:
`under_review` is KEPT. The scoped ladder omitted it, but it is in the API's
declared contract and two code paths write it, so removing it is a behaviour
change (an employer "looking at" an application stops being expressible), not a
renaming. That belongs in Phase B with the employer UI, not in a vocabulary
alignment.
"""

# In order. Position matters: it is what makes "further along" a real question.
APPLICATION_STAGES = (
    'submitted',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'offered',
    'placed',
)

# Ways an application leaves the ladder. Not ordered — they are ends, not steps.
APPLICATION_TERMINAL = (
    'rejected',    # the employer's decision; carries a standardised reason
    'withdrawn',   # the candidate's own act
)

ALL_APPLICATION_STATUSES = frozenset(APPLICATION_STAGES + APPLICATION_TERMINAL)

# Everything previously written, mapped to what it meant.
#
# 'accepted' -> 'placed': it was set when an offer was accepted, which is the
# same event "hired" and "placed" describe.
# 'interview' -> 'interview_scheduled': it was set when an interview was BOOKED,
# not conducted. Mapping it to 'interviewed' would claim an interview happened.
LEGACY_STATUS_MAP = {
    'accepted': 'placed',
    'hired': 'placed',
    'interview': 'interview_scheduled',
    'offer': 'offered',
    'reviewing': 'under_review',
    'pending': 'submitted',
}


def normalise_status(value):
    """Canonical form of a status, or None if it is not one we recognise.

    Returning None rather than guessing: a status nobody defined should surface
    as a rejected write, not be silently filed under whatever looked closest.
    """
    if not value:
        return None
    v = str(value).strip().lower()
    v = LEGACY_STATUS_MAP.get(v, v)
    return v if v in ALL_APPLICATION_STATUSES else None


def stage_index(value):
    """How far along the ladder, or None for terminal/unknown states.

    Lets callers ask "is this further on than that" without hardcoding an order
    in three different files.
    """
    v = normalise_status(value)
    return APPLICATION_STAGES.index(v) if v in APPLICATION_STAGES else None
