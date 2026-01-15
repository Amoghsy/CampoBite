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
import { Utensils, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API = 'http://localhost:8082/api/auth';


export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    usn: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  /* ================= NORMAL SIGNUP ================= */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      await axios.post(`${API}/signup`, {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
        usn: signupData.role === 'student' ? signupData.usn : undefined,
      });

      toast({
        title: 'Signup successful',
        description: 'Please login now',
      });

    } catch (err: any) {
      toast({
        title: 'Signup failed',
        description:
          typeof err.response?.data === 'string'
            ? err.response.data
            : 'Signup error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= NORMAL LOGIN ================= */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("LOGIN BUTTON CLICKED");

    try {
      const res = await axios.post(`${API}/login`, loginData);

      console.log("AXIOS RESPONSE:", res.data);

      const token =
        res.data.token || res.data.jwt || res.data.accessToken;

      const role = res.data.role;

      console.log('Login response:', res.data);
      console.log('Token:', token);
      console.log('Role:', role);

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // 🔥 ROLE BASED REDIRECT
      if (role && role.toLowerCase() === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }

    } catch (err: any) {
      console.error("LOGIN ERROR", err);
    }
  };



  /* ================= GOOGLE SIGNUP ================= */
  const handleGoogleSignup = async (res: any) => {
    try {
      await axios.post(`${API}/google/signup`, {
        token: res.credential,
      });

      toast({
        title: 'Google signup successful',
        description: 'Please login now',
      });

    } catch (err: any) {
      toast({
        title: 'Google signup failed',
        description:
          typeof err.response?.data === 'string'
            ? err.response.data
            : 'Google signup error',
        variant: 'destructive',
      });
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, []);

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async (res: any) => {
    try {
      const response = await axios.post(`${API}/google/login`, {
        token: res.credential,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);

      console.log('Google login response:', response.data);
      console.log('Token:', response.data.token);
      console.log('Role:', response.data.role);

      toast({
        title: 'Login successful',
        description: 'Signed in with Google',
      });

      // 🔥 ROLE BASED REDIRECT
      if (response.data.role && response.data.role.toLowerCase() === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }

    } catch (err: any) {
      toast({
        title: 'Google login failed',
        description:
          typeof err.response?.data === 'string'
            ? err.response.data
            : 'Please sign up first',
        variant: 'destructive',
      });
    }
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
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    placeholder="Email"
                    type="email"
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

                  <div className="text-center text-xs text-muted-foreground">OR</div>

                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => console.log('Google Login Failed')}
                  />
                </form>
              </TabsContent>

              {/* SIGNUP */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
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

                  <Input
                    placeholder="Password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    required
                  />

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
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>

                  <div className="text-center text-xs text-muted-foreground">OR</div>

                  <GoogleLogin
                    onSuccess={handleGoogleSignup}
                    onError={() => console.log('Google Signup Failed')}
                  />
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
