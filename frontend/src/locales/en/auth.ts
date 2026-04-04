// Authentication related translations
export const auth = {
  login: 'Login',
  register: 'Register',
  logout: 'Logout',
  
  // Login
  loginWelcome: 'Welcome to Chambit Church',
  loginTitle: 'Login',
  loginUsername: 'Username',
  loginPassword: 'Password',
  loginButton: 'Login',
  loginLoading: 'Logging in...',
  loginFailed: 'Login failed',
  loginNoAccount: "Don't have an account?",
  loginSignUp: 'Sign Up',
  loginBackHome: 'Back to Home',
  
  // Register
  registerTitle: 'Sign Up',
  registerWelcome: 'Use Chambit Church online services',
  registerFullName: 'Full Name (Optional)',
  registerUsername: 'Username',
  registerPassword: 'Password (min 6 characters)',
  registerConfirmPassword: 'Confirm Password',
  registerButton: 'Sign Up',
  registerLoading: 'Signing up...',
  registerFailed: 'Sign up failed',
  registerHaveAccount: 'Already have an account?',
  registerLogin: 'Login',
  registerPasswordMismatch: 'Passwords do not match',
  registerSuccess: 'Registration completed. Please login.',
  
  // Anonymous/Real Name
  anonymous: 'Anonymous',
  realName: 'Real Name',
  anonymousNotice: 'Prayer request will be posted anonymously. Only display name will be visible.',
  realNameNotice: 'Prayer request will be posted with your real name. Others can see who wrote it.',
} as const
