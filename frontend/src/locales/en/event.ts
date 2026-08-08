// Event translations
export const event = {
  title: 'Church Events',
  calendar: 'Calendar',
  list: 'List',
  detail: 'Details',
  create: 'Create Event',
  edit: 'Edit Event',
  delete: 'Delete Event',
  
  // Categories
  category: 'Category',
  categories: {
    all: 'All',
    worship: 'Worship',
    meeting: 'Meeting',
    service: 'Service',
    special: 'Special Event',
    education: 'Education',
    other: 'Other',
  },
  
  // Fields
  eventTitle: 'Title',
  description: 'Description',
  startDate: 'Start Date/Time',
  endDate: 'End Date/Time',
  location: 'Location',
  attachment: 'Attachment',
  repeatType: 'Repeat',
  repeatEndDate: 'Repeat End Date',
  isPublished: 'Published',
  
  // Repeat types
  repeat: {
    none: 'No Repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  },
  
  // Attendance
  attendance: 'Attendance',
  attendanceCount: 'Attending',
  attendanceStatus: {
    attending: 'Attending',
    maybe: 'Maybe',
    not_attending: 'Not Attending',
  },
  attend: 'RSVP',
  cancelAttendance: 'Cancel RSVP',
  currentStatus: 'Your response',
  changeTo: 'Change to {status}',
  rsvpDeadline: 'RSVP Deadline',
  rsvpClosed: 'RSVP closed',
  rsvpClosesOn: 'RSVP closes on {date}',
  rsvpDeadlineAfterStart: 'The RSVP deadline cannot be later than the event start time.',
  rsvpRemaining: '{time} left',
  rsvpClosedBadge: 'RSVP closed',
  rsvpClosedForResponder: 'You can still change or cancel your response.',
  rsvpClosedForNewcomer: 'New RSVPs are no longer accepted.',
  rsvpCancelAfterCloseTitle: 'Cancel RSVP',
  rsvpCancelAfterCloseConfirm:
    'RSVP has closed. If you cancel now you will not be able to sign up again.\nCancel anyway?',
  rsvpCancelAfterCloseAction: 'Cancel RSVP',

  // Detail page quick actions
  addToCalendar: 'Add to calendar',
  viewMap: 'Map',
  share: 'Share',
  linkCopied: 'Link copied!',

  // Attendees
  attendees: "Who's coming",
  attendeesMaybeCount: '{count} maybe',
  attendeesNotAttendingCount: '{count} not attending',

  // Small-group-only meeting
  groupOnlyBadge: 'Group only',
  groupLabel: 'Group',
  groupOptional: 'Group (optional)',
  groupPublic: 'Public',
  selectGroup: 'Select group',
  
  // Comments
  comments: 'Comments',
  writeComment: 'Write Comment',
  deleteComment: 'Delete Comment',
  noComments: 'No comments yet — be the first to say hi ✨',
  
  // Empty state card
  emptyTitleAll: 'A calm week ahead!',
  emptyTitleCategory: 'No {label} events scheduled yet',
  emptyDescAll: 'How about suggesting a gathering to your friends first? ✨',
  emptyDescCategory: 'Try another category — new updates are on the way ✨',
  emptyCreateEvent: 'Create Event',
  emptyBrowseGroups: 'Browse My Groups',

  // Messages
  noEvents: 'No events found',
  loadMore: 'Load More',
  views: 'Views',
  
  // Form
  selectCategory: 'Select Category',
  selectRepeatType: 'Select Repeat Type',
  enterTitle: 'Enter title',
  enterDescription: 'Enter description',
  enterLocation: 'Enter location',
  uploadFile: 'Upload File',
  
  // Confirmation
  confirmDelete: 'Are you sure you want to delete this event?',
  confirmDeleteAction: 'Delete',
  confirmDeleteCommentTitle: 'Delete comment',
  confirmDeleteComment: 'Are you sure you want to delete this comment?',
  confirmDeleteCommentAction: 'Delete',
  
  // Success/Error messages
  createSuccess: 'Event created successfully',
  updateSuccess: 'Event updated successfully',
  deleteSuccess: 'Event deleted successfully',
  attendSuccess: 'RSVP registered successfully',
  cancelSuccess: 'RSVP cancelled successfully',
  commentSuccess: 'Comment posted successfully',
  commentDeleteSuccess: 'Comment deleted successfully',
  
  error: 'An error occurred',
  loginRequired: 'Login required',
} as const
