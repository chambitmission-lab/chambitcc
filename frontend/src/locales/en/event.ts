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
  
  // Comments
  comments: 'Comments',
  writeComment: 'Write Comment',
  deleteComment: 'Delete Comment',
  
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
  confirmDeleteComment: 'Are you sure you want to delete this comment?',
  
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
