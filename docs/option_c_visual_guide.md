# Option C Visual Guide

This guide provides visual descriptions and UI mockups for the Option C features implementation.

---

## Part 1: Create Offer Button

### Location
The "Create Offer" button appears at the top of the Shortlist Manager interface, next to other action buttons.

### Visual States

#### State 1: No Candidates Selected (Button Hidden)
```
┌─────────────────────────────────────────────────────────────┐
│ Shortlist Manager - Software Engineer Position              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔄 Refresh] [📧 Message Selected] [📊 View Statistics]   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☐  Name          Status    Score   Interview  Actions│  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ☐  John Doe      Contacted  92%    4⭐ Hire    🗓️💬📝│  │
│  │ ☐  Jane Smith    Shortlist  88%    -          🗓️💬📝│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### State 2: Candidates Selected (Button Visible)
```
┌─────────────────────────────────────────────────────────────┐
│ Shortlist Manager - Software Engineer Position              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔄 Refresh] [📧 Message] [🎁 Create Offer (2)] [📊 Stats]│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☐  Name          Status    Score   Interview  Actions│  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ☑  John Doe      Contacted  92%    4⭐ Hire    🗓️💬📝│  │
│  │ ☑  Jane Smith    Shortlist  88%    -          🗓️💬📝│  │
│  │ ☐  Bob Johnson   Contacted  85%    3⭐ Next    🗓️💬📝│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Button Specifications

**Visual Properties**:
- **Color**: Primary blue (`color="primary"`)
- **Variant**: Contained (filled button)
- **Icon**: CardGiftcard icon (🎁)
- **Text**: "Create Offer" + count in parentheses
- **Size**: Medium (standard Material-UI button size)

**Behavior**:
- Appears only when `selectedCandidates.length > 0`
- Updates count dynamically as candidates are selected/deselected
- Positioned between "Message Selected" and "View Statistics" buttons
- Clicking opens CreateOfferDialog

### Dialog Appearance

When clicked, the CreateOfferDialog opens:

```
┌─────────────────────────────────────────────────────┐
│ Create Job Offer                                [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Candidate: John Doe                                │
│  Position: Software Engineer                        │
│                                                      │
│  Salary Offered *                                   │
│  ┌──────────────────────┐  ┌──────────────┐        │
│  │ 120000              │  │ AED ▼        │        │
│  └──────────────────────┘  └──────────────┘        │
│                                                      │
│  Benefits                                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ Health insurance, annual bonus, flexible    │   │
│  │ working hours                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Start Date *         Expiry Date *                 │
│  ┌─────────────┐      ┌─────────────┐              │
│  │ 2024-12-01 │      │ 2024-11-15 │              │
│  └─────────────┘      └─────────────┘              │
│                                                      │
│  Terms & Conditions                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Standard employment contract with 3-month   │   │
│  │ probation period                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│              [Cancel]  [Create Offer]               │
└─────────────────────────────────────────────────────┘
```

---

## Part 2: Add Interview Feedback Action

### Location
The "Add Interview Feedback" button appears in the Actions column of the shortlist table, alongside existing action buttons.

### Table Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Shortlist Manager - Software Engineer Position                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ ☐  Name      Status    Score  Interview      Actions         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ ☐  John Doe  Contacted  92%   4⭐ Hire       🗓️ 📝 💬 📋    │ │
│  │                                                ↑  ↑  ↑  ↑     │ │
│  │                                                │  │  │  │     │ │
│  │                                                │  │  │  └─ Update Status │
│  │                                                │  │  └─── Add Note       │
│  │                                                │  └────── Add Feedback   │
│  │                                                └───────── Schedule Interview │
│  │                                                                │ │
│  │ ☐  Jane Smith Shortlist 88%   -              🗓️ 📝 💬 📋    │ │
│  │ ☐  Bob Johnson Contacted 85%  3⭐ Next       🗓️ 📝 💬 📋    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Button Specifications

**Visual Properties**:
- **Icon**: RateReview icon (📝)
- **Color**: Secondary (purple/pink - `color="secondary"`)
- **Size**: Small (`size="small"`)
- **Type**: IconButton (circular button with icon only)
- **Tooltip**: "Add Interview Feedback"

**Position**:
- Second button in Actions column
- Between "Schedule Interview" (🗓️) and "Add Note" (💬) buttons
- Consistent alignment with other action buttons

### Dialog Appearance

When clicked, the Interview Feedback Dialog opens:

```
┌─────────────────────────────────────────────────────┐
│ Add Interview Feedback                          [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Rating (1-5) *                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 4 - Good                                   ▼│   │
│  └─────────────────────────────────────────────┘   │
│  Options:                                           │
│    1 - Poor                                         │
│    2 - Below Average                                │
│    3 - Average                                      │
│    4 - Good                                         │
│    5 - Excellent                                    │
│                                                      │
│  Recommendation *                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Hire                                       ▼│   │
│  └─────────────────────────────────────────────┘   │
│  Options:                                           │
│    Hire                                             │
│    Reject                                           │
│    Next Round                                       │
│    Hold                                             │
│                                                      │
│  Feedback Notes *                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Excellent technical skills and cultural     │   │
│  │ fit. Strong communication and problem-      │   │
│  │ solving abilities demonstrated during the   │   │
│  │ interview.                                  │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│              [Cancel]  [Save Feedback]              │
└─────────────────────────────────────────────────────┘
```

### Interview Column Display

The Interview column shows feedback information in a compact format:

#### Without Feedback
```
┌──────────────┐
│ Interview    │
├──────────────┤
│ -            │
└──────────────┘
```

#### With Feedback
```
┌──────────────────────┐
│ Interview            │
├──────────────────────┤
│ 4⭐ Hire             │
│ (Excellent tech...)  │
└──────────────────────┘
```

**Display Format**:
- **Line 1**: Rating (stars) + Recommendation
  - 1 star: ⭐
  - 2 stars: ⭐⭐
  - 3 stars: ⭐⭐⭐
  - 4 stars: ⭐⭐⭐⭐
  - 5 stars: ⭐⭐⭐⭐⭐
- **Line 2**: Feedback preview (first 50 characters)
- **Color coding**:
  - Hire: Green chip
  - Reject: Red chip
  - Next Round: Blue chip
  - Hold: Orange chip

---

## User Interaction Flows

### Flow 1: Creating an Offer

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Open Shortlist      │
│ Manager             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select Candidate(s) │
│ using checkboxes    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ "Create Offer"      │────▶│ Button appears   │
│ button appears      │     │ with count       │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Create       │
│ Offer" button       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Dialog opens with   │────▶│ Pre-filled       │
│ offer form          │     │ candidate info   │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐
│ Fill in offer       │
│ details             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Create       │
│ Offer"              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Success notification│────▶│ "Offer created   │
│ appears             │     │ successfully!"   │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Status updates to   │────▶│ Chip shows       │
│ "offer_sent"        │     │ "Offer Sent"     │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

### Flow 2: Adding Interview Feedback

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Open Shortlist      │
│ Manager             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Locate candidate    │
│ in table            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Click RateReview    │────▶│ Purple icon in   │
│ icon (📝)           │     │ Actions column   │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐
│ Feedback dialog     │
│ opens               │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Check if existing   │────▶│ Pre-fill if      │
│ feedback exists     │     │ available        │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐
│ Select rating       │
│ (1-5)               │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select              │
│ recommendation      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Enter feedback      │
│ notes               │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Save         │
│ Feedback"           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Success notification│────▶│ "Feedback added  │
│ appears             │     │ successfully!"   │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Interview column    │────▶│ Shows rating &   │
│ updates             │     │ recommendation   │
└──────┬──────────────┘     └──────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

---

## Color Scheme

### Button Colors

| Button | Color | Material-UI | Hex Code |
|--------|-------|-------------|----------|
| Create Offer | Primary | `color="primary"` | #1976d2 (blue) |
| Add Feedback | Secondary | `color="secondary"` | #9c27b0 (purple) |
| Schedule Interview | Primary | `color="primary"` | #1976d2 (blue) |
| Add Note | Default | `color="default"` | #757575 (gray) |
| Update Status | Default | `color="default"` | #757575 (gray) |

### Status Chip Colors

| Status | Color | Material-UI | Visual |
|--------|-------|-------------|--------|
| Shortlisted | Info | `color="info"` | Blue |
| Contacted | Primary | `color="primary"` | Dark Blue |
| Interview Scheduled | Secondary | `color="secondary"` | Purple |
| Interviewed | Warning | `color="warning"` | Orange |
| Offer Sent | Success | `color="success"` | Green |
| Hired | Success | `color="success"` | Green |
| Rejected | Error | `color="error"` | Red |
| Withdrawn | Default | `color="default"` | Gray |

### Recommendation Colors

| Recommendation | Color | Chip Color |
|----------------|-------|------------|
| Hire | Green | `color="success"` |
| Reject | Red | `color="error"` |
| Next Round | Blue | `color="primary"` |
| Hold | Orange | `color="warning"` |

---

## Responsive Design

### Desktop View (> 1200px)
- Full table with all columns visible
- Action buttons displayed horizontally
- Dialog width: 600px (maxWidth="sm")
- Comfortable spacing between elements

### Tablet View (768px - 1200px)
- Table scrolls horizontally if needed
- Action buttons remain visible
- Dialog width: 90% of viewport
- Reduced padding

### Mobile View (< 768px)
- Table becomes scrollable
- Action buttons stack vertically in dropdown menu
- Dialog becomes full-screen
- Touch-friendly button sizes (minimum 44x44px)

---

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between form fields
- **Enter**: Submit form / Click focused button
- **Escape**: Close dialog
- **Space**: Toggle checkbox / Select dropdown option

### Screen Reader Support
- All buttons have `aria-label` attributes
- Form fields have associated labels
- Error messages are announced
- Success notifications are announced
- Dialog has proper `role="dialog"` attribute

### Visual Indicators
- Focus rings on interactive elements
- High contrast colors (WCAG AA compliant)
- Clear hover states
- Disabled state styling
- Loading indicators during async operations

---

## Animation & Transitions

### Button Appearance
- **Create Offer Button**: Fade in with slide down (300ms)
- **Hover State**: Scale up 1.05x with shadow increase
- **Click State**: Scale down 0.95x momentarily

### Dialog Transitions
- **Open**: Fade in background + slide up dialog (225ms)
- **Close**: Fade out background + slide down dialog (195ms)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material-UI default)

### Notification Transitions
- **Success**: Slide in from top (300ms)
- **Error**: Shake animation (500ms)
- **Auto-dismiss**: Fade out after 5 seconds

### Table Updates
- **Status Change**: Color transition (300ms)
- **Interview Column Update**: Fade in new content (200ms)
- **Row Highlight**: Background color pulse (500ms)

---

## Error States

### Create Offer Errors

#### Missing Required Fields
```
┌─────────────────────────────────────────────────────┐
│ Create Job Offer                                [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Salary Offered *                                   │
│  ┌──────────────────────┐  ┌──────────────┐        │
│  │                     │  │ AED ▼        │        │
│  └──────────────────────┘  └──────────────┘        │
│  ⚠️ Salary is required                              │
│                                                      │
│  Start Date *         Expiry Date *                 │
│  ┌─────────────┐      ┌─────────────┐              │
│  │            │      │            │              │
│  └─────────────┘      └─────────────┘              │
│  ⚠️ Start date is required                          │
│                                                      │
│              [Cancel]  [Create Offer]               │
│                         (disabled)                  │
└─────────────────────────────────────────────────────┘
```

#### Network Error
```
┌─────────────────────────────────────────────────────┐
│ ❌ Error                                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Failed to create offer. Please try again.          │
│                                                      │
│  [Dismiss]                                          │
└─────────────────────────────────────────────────────┘
```

### Add Feedback Errors

#### No Interview Scheduled
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Warning                                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  No interview found for this candidate.             │
│  Please schedule an interview first.                │
│                                                      │
│  [OK]                                               │
└─────────────────────────────────────────────────────┘
```

#### Empty Feedback Notes
```
┌─────────────────────────────────────────────────────┐
│ Add Interview Feedback                          [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Feedback Notes *                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│  ⚠️ Feedback notes are required                     │
│                                                      │
│              [Cancel]  [Save Feedback]              │
│                         (disabled)                  │
└─────────────────────────────────────────────────────┘
```

---

## Success States

### Offer Created Successfully
```
┌─────────────────────────────────────────────────────┐
│ ✅ Success                                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Offer created successfully!                        │
│                                                      │
│  Auto-dismiss in 5 seconds...                       │
└─────────────────────────────────────────────────────┘
```

### Feedback Added Successfully
```
┌─────────────────────────────────────────────────────┐
│ ✅ Success                                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Interview feedback added successfully!             │
│                                                      │
│  Auto-dismiss in 5 seconds...                       │
└─────────────────────────────────────────────────────┘
```

---

## Loading States

### Creating Offer
```
┌─────────────────────────────────────────────────────┐
│ Create Job Offer                                [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│              ⏳ Creating offer...                   │
│                                                      │
│              [Cancel]  [Creating...]                │
│                         (disabled)                  │
└─────────────────────────────────────────────────────┘
```

### Saving Feedback
```
┌─────────────────────────────────────────────────────┐
│ Add Interview Feedback                          [✕] │
├─────────────────────────────────────────────────────┤
│                                                      │
│              ⏳ Saving feedback...                  │
│                                                      │
│              [Cancel]  [Saving...]                  │
│                         (disabled)                  │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Material-UI Components Used

1. **Button**: Create Offer button
2. **IconButton**: Action buttons (Schedule, Feedback, Note, Status)
3. **Dialog**: Modal dialogs for forms
4. **DialogTitle**: Dialog header
5. **DialogContent**: Dialog body
6. **DialogActions**: Dialog footer with buttons
7. **TextField**: Text input fields
8. **Select**: Dropdown selectors
9. **MenuItem**: Dropdown options
10. **FormControl**: Form field wrapper
11. **InputLabel**: Field labels
12. **Tooltip**: Hover tooltips
13. **Chip**: Status and recommendation badges
14. **Box**: Layout container
15. **Snackbar**: Notification messages (implied)

### Custom Styling

Minimal custom CSS required - mostly using Material-UI's built-in styling system:

```typescript
sx={{ 
  pt: 2,        // Padding top: 16px
  mb: 2,        // Margin bottom: 16px
  fullWidth     // Width: 100%
}}
```

---

## Browser Support

Tested and verified on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

---

**Document Version**: 1.0  
**Last Updated**: November 4, 2024  
**Status**: Complete

