import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Utensils, ArrowLeft, Eye, EyeOff, Mail, KeyRound, ArrowRight, Check, Users } from 'lucide-react';

const API = 'campobite-production.up.railway.app';
//const API = 'http://localhost:8082'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function PasswordRules({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One digit', ok: /\d/.test(password) },
  ];
  return (
    <div className="space-y-1 mt-1">
      {rules.map((r) => (
        <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : 'text-muted-foreground'}`}>
          <Check className={`h-3 w-3 ${r.ok ? 'opacity-100' : 'opacity-30'}`} />
          {r.label}
        </div>
      ))}
    </div>
  );
}

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    usn: '',
  });
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [signupOtp, setSignupOtp] = useState('');

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<'hidden' | 'email' | 'otp' | 'newpass'>('hidden');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Google signup role selection
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<string | null>(null);
  const [googleRole, setGoogleRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  const { toast } = useToast();
  const navigate = useNavigate();

  /* ================= SIGNUP STEP 1: SEND OTP ================= */
  const handleSignupSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(signupData.password)) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters with uppercase, lowercase, and a digit', variant: 'destructive' });
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`${API}/api/auth/signup/send-otp`, {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
        usn: signupData.role === 'student' ? signupData.usn : undefined,
      });
      toast({ title: 'OTP Sent!', description: `Verification code sent to ${signupData.email}` });
      setSignupStep('otp');
    } catch (err: any) {
      toast({
        title: 'Signup failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Could not send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SIGNUP STEP 2: VERIFY OTP ================= */
  const handleSignupVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API}/api/auth/signup/verify-otp`, {
        email: signupData.email,
        otp: signupOtp,
      });
      toast({ title: 'Account Created!', description: 'Your email is verified. Please login.' });
      setSignupStep('form');
      setSignupOtp('');
      setSignupData({ name: '', email: '', password: '', confirmPassword: '', role: 'student', usn: '' });
      setActiveTab('login');
    } catch (err: any) {
      toast({
        title: 'Verification failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= NORMAL LOGIN ================= */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/login`, loginData);
      const token = res.data.token || res.data.jwt || res.data.accessToken;
      const role = res.data.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (role && role.toLowerCase() === "admin") {
        window.location.href = "/admin";
      } else if (role && role.toLowerCase() === "staff") {
        window.location.href = "/staff";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  /* ================= FORGOT PASSWORD STEP 1: SEND OTP ================= */
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API}/api/auth/forgot-password/send-otp`, { email: forgotEmail });
      toast({ title: 'OTP Sent!', description: `Reset code sent to ${forgotEmail}` });
      setForgotStep('otp');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Could not send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= FORGOT PASSWORD STEP 2: VERIFY OTP ================= */
  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Just move to new password step — actual OTP verification happens on reset
    setForgotStep('newpass');
  };

  /* ================= FORGOT PASSWORD STEP 3: RESET ================= */
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(forgotNewPassword)) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters with uppercase, lowercase, and a digit', variant: 'destructive' });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`${API}/api/auth/forgot-password/reset`, {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });
      toast({ title: 'Password Reset!', description: 'You can now login with your new password.' });
      setForgotStep('hidden');
      setForgotEmail('');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Could not reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE SIGNUP ================= */
  // Step 1: Google OAuth done — store credential and show role picker
  const handleGoogleSignup = (res: any) => {
    setPendingGoogleCredential(res.credential);
    setGoogleRole('STUDENT');
  };

  // Step 2: User picked a role — now create the account
  const confirmGoogleSignup = async () => {
    if (!pendingGoogleCredential) return;
    try {
      setIsLoading(true);
      await axios.post(`${API}/api/auth/google/signup`, {
        token: pendingGoogleCredential,
        role: googleRole,
      });
      toast({ title: 'Google signup successful', description: 'Please login now' });
      setPendingGoogleCredential(null);
      setActiveTab('login');
    } catch (err: any) {
      toast({
        title: 'Google signup failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Google signup error',
        variant: 'destructive',
      });
      setPendingGoogleCredential(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      if (role.toLowerCase() === "admin") navigate("/admin");
      else if (role.toLowerCase() === "staff") navigate("/staff");
      else navigate("/dashboard");
    }
  }, []);

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async (res: any) => {
    try {
      const response = await axios.post(`${API}/api/auth/google/login`, { token: res.credential });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      toast({ title: 'Login successful', description: 'Signed in with Google' });

      if (response.data.role && response.data.role.toLowerCase() === "admin") {
        window.location.href = "/admin";
      } else if (response.data.role && response.data.role.toLowerCase() === "staff") {
        window.location.href = "/staff";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast({
        title: 'Google login failed',
        description: typeof err.response?.data === 'string' ? err.response.data : 'Please sign up first',
        variant: 'destructive',
      });
    }
  };

  /* ================= FORGOT PASSWORD UI ================= */
  const renderForgotPassword = () => {
    if (forgotStep === 'hidden') return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setForgotStep('hidden')}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </button>
        </div>

        <div className="text-center mb-4">
          <KeyRound className="h-10 w-10 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-lg">Reset Password</h3>
          <p className="text-sm text-muted-foreground">
            {forgotStep === 'email' && "Enter your email to receive a reset code"}
            {forgotStep === 'otp' && "Enter the 6-digit code sent to your email"}
            {forgotStep === 'newpass' && "Set your new password"}
          </p>
        </div>

        {forgotStep === 'email' && (
          <form onSubmit={handleForgotSendOtp} className="space-y-4">
            <Input
              placeholder="Email Address"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <Button className="w-full gradient-primary" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        )}

        {forgotStep === 'otp' && (
          <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
            <Input
              placeholder="Enter 6-digit OTP"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              required
            />
            <Button className="w-full gradient-primary" disabled={isLoading || forgotOtp.length !== 6}>
              <ArrowRight className="h-4 w-4 mr-2" /> Continue
            </Button>
          </form>
        )}

        {forgotStep === 'newpass' && (
          <form onSubmit={handleForgotReset} className="space-y-4">
            <div>
              <Input
                placeholder="New Password"
                type="password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
              />
              <PasswordRules password={forgotNewPassword} />
            </div>
            <Input
              placeholder="Confirm New Password"
              type="password"
              value={forgotConfirmPassword}
              onChange={(e) => setForgotConfirmPassword(e.target.value)}
              required
            />
            <Button className="w-full gradient-primary" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="container pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Utensils className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle>
              Welcome to <span className="gradient-text">CampoBite</span>
            </CardTitle>
            <CardDescription>Sign up once, then login</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Google Signup Role Selection Dialog */}
            {pendingGoogleCredential && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">One last step!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tell us who you are to complete your Google signup.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('STUDENT')}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${googleRole === 'STUDENT'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/40'
                      }`}
                  >
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="font-semibold text-sm">Student</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('FACULTY')}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${googleRole === 'FACULTY'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/40'
                      }`}
                  >
                    <div className="text-2xl mb-1">👨‍🏫</div>
                    <div className="font-semibold text-sm">Faculty</div>
                  </button>
                </div>
                <Button
                  className="w-full gradient-primary"
                  onClick={confirmGoogleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Continue as ' + (googleRole === 'STUDENT' ? 'Student' : 'Faculty')}
                </Button>
                <button
                  type="button"
                  onClick={() => setPendingGoogleCredential(null)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Forgot Password Flow (overlays the tabs) */}
            {!pendingGoogleCredential && forgotStep !== 'hidden' ? (
              renderForgotPassword()
            ) : !pendingGoogleCredential && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup" onClick={() => setSignupStep('form')}>Sign Up</TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      placeholder="Email"
                      type="email"
                      id="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                    />

                    <div className="relative">
                      <Input
                        placeholder="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <Button className="w-full gradient-primary" disabled={isLoading}
                      type="submit">
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="w-full text-center text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>

                    <div className="text-center text-xs text-muted-foreground">OR</div>

                    <div className="flex justify-center w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => console.log('Google Login Failed')}
                      />
                    </div>
                  </form>
                </TabsContent>

                {/* SIGNUP */}
                <TabsContent value="signup">
                  {signupStep === 'form' ? (
                    <form onSubmit={handleSignupSendOtp} className="space-y-4">
                      <Input
                        placeholder="Full Name"
                        value={signupData.name}
                        onChange={(e) =>
                          setSignupData({ ...signupData, name: e.target.value })
                        }
                        required
                      />

                      <Input
                        placeholder="Email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        required
                      />

                      <Select
                        value={signupData.role}
                        onValueChange={(v) =>
                          setSignupData({ ...signupData, role: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>

                      {signupData.role === 'student' && (
                        <Input
                          placeholder="USN (University Seat Number)"
                          value={signupData.usn}
                          onChange={(e) =>
                            setSignupData({ ...signupData, usn: e.target.value })
                          }
                          required
                        />
                      )}

                      <div>
                        <Input
                          placeholder="Password"
                          type="password"
                          value={signupData.password}
                          onChange={(e) =>
                            setSignupData({ ...signupData, password: e.target.value })
                          }
                          required
                        />
                        <PasswordRules password={signupData.password} />
                      </div>

                      <Input
                        placeholder="Confirm Password"
                        type="password"
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />

                      <Button className="w-full gradient-primary" disabled={isLoading}>
                        {isLoading ? 'Sending OTP...' : 'Create Account'}
                      </Button>

                      <div className="text-center text-xs text-muted-foreground">OR</div>

                      <div className="flex justify-center w-full">
                        <GoogleLogin
                          onSuccess={handleGoogleSignup}
                          onError={() => console.log('Google Signup Failed')}
                        />
                      </div>
                    </form>
                  ) : (
                    /* OTP Verification Step */
                    <form onSubmit={handleSignupVerifyOtp} className="space-y-4">
                      <div className="text-center mb-4">
                        <Mail className="h-10 w-10 mx-auto text-primary mb-2" />
                        <h3 className="font-semibold text-lg">Verify Your Email</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter the 6-digit code sent to <strong>{signupData.email}</strong>
                        </p>
                      </div>

                      <Input
                        placeholder="Enter 6-digit OTP"
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="text-center text-2xl tracking-[0.5em] font-mono"
                        required
                      />

                      <Button className="w-full gradient-primary" disabled={isLoading || signupOtp.length !== 6}>
                        {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setSignupStep('form')}
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Go back
                      </button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
