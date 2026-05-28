import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, ArrowLeft, Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // OTP inputs handlers
  const handleOtpChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (errors.otp) {
        setErrors((prev) => ({ ...prev, otp: "" }));
      }

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      if (errors.otp) {
        setErrors((prev) => ({ ...prev, otp: "" }));
      }
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Email is invalid" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/users/forget-password", { email });
      
      toast.success(response.data.message || "OTP sent to your email!");
      
      if (response.data.userId) {
        setUserId(response.data.userId);
      }
      
      setStep("reset");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to send reset OTP. Please check your email.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP from step 2
  const handleResendOtp = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/forget-password", { email });
      toast.success(response.data.message || "OTP resent successfully!");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to resend OTP.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const enteredOtp = otp.join("");
    const newErrors: Record<string, string> = {};

    if (enteredOtp.length < 6) {
      newErrors.otp = "Please enter the full 6-digit OTP";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/users/reset-password", {
        userId,
        otp: enteredOtp,
        newPassword,
      });

      toast.success(response.data.message || "Password reset successfully!");
      navigate("/signin");
    } catch (err: any) {
      const message = err.response?.data?.message || "Password reset failed. Please check your OTP and try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-accent flex items-center justify-center p-4">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link to="/signin">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">ScanDine</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {step === "email" ? "Reset Password" : "Enter Verification Code"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground px-4">
            {step === "email"
              ? "Enter your registered email and we'll send you a verification code to reset your password."
              : `We sent a 6-digit OTP to your email: ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errors.general && (
            <div className="bg-destructive/10 text-destructive border border-destructive/50 p-3 rounded-md text-sm mb-5 text-center">
              {errors.general}
            </div>
          )}

          {step === "email" ? (
            /* Email Request Form */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({});
                    }}
                    className={`h-11 pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/75" />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          ) : (
            /* OTP and Password Reset Form */
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* OTP Fields */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Verification Code</Label>
                <div className="flex justify-between gap-2 py-1">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el!)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      onPaste={handleOtpPaste}
                      className={`w-12 h-12 text-center text-lg font-semibold rounded-lg border 
                        bg-background text-foreground outline-none transition
                        focus:ring-2 focus:ring-primary focus:border-primary
                        ${errors.otp ? "border-destructive focus:ring-destructive" : "border-muted"}`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-xs text-destructive text-center">{errors.otp}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }));
                    }}
                    className={`h-11 pr-10 pl-10 ${
                      errors.newPassword ? "border-destructive" : ""
                    }`}
                  />
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/75" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 w-11 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    className={`h-11 pr-10 pl-10 ${
                      errors.confirmPassword ? "border-destructive" : ""
                    }`}
                  />
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/75" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 w-11 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit & Navigation Buttons */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="flex flex-col gap-2 pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
                >
                  Didn't receive code? Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp(Array(6).fill(""));
                    setNewPassword("");
                    setConfirmPassword("");
                    setErrors({});
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
