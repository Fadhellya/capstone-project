import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Brain, BarChart3, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            FraudGuard ML
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Advanced Machine Learning Fraud Detection Platform for Fintech Companies
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-gray-100"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-sign-in"
          >
            <Lock className="mr-2" size={20} />
            Sign In to Continue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Advanced ML Training
              </h3>
              <p className="text-blue-100 text-sm">
                Train sophisticated fraud detection models with multiple algorithms
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Real-time Analytics
              </h3>
              <p className="text-blue-100 text-sm">
                Comprehensive visualization and performance metrics
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Enterprise Security
              </h3>
              <p className="text-blue-100 text-sm">
                Bank-grade security for high-value transaction monitoring
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
