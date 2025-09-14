// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, BarChart2, Smartphone, TrendingUp, Zap, Users, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">

      {/* Hero Section */}
      <section className="container mx-auto px-6 lg:px-20 py-16 md:py-24 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Take Control of Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Financial Future</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Personal Finance Manager by Heegan Technology. Track expenses, manage budgets, and grow your wealth with our intuitive financial dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link
              to="/register"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group font-medium"
            >
              Start Free Trial
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 bg-white text-gray-700 px-8 py-4 rounded-xl hover:shadow-md transition-all duration-300 flex items-center justify-center font-medium"
            >
             Sign In
            </Link>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <Users size={20} />
            <p>Join <span className="font-semibold text-indigo-600">000+</span> users managing their finances</p>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="public/finance_dashboard.jpg"
              alt="Finance Dashboard"
              className="w-full h-auto"
            />
          </div>
          <div className="absolute -top-6 -right-6 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 z-0"></div>
          <div className="absolute -bottom-6 -left-6 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 z-0"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 shadow-sm">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">00%</div>
              <p className="text-gray-600">User Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">$00+</div>
              <p className="text-gray-600">Tracked Monthly</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">24/7</div>
              <p className="text-gray-600">Support</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">00+</div>
              <p className="text-gray-600">Integrations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 lg:px-20 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose FinanceTracker?</h2>
          <p className="text-gray-600 text-lg">Everything you need to take control of your financial life in one place</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-5 border border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <BarChart2 size={32} className="text-indigo-600"/>
            </div>
            <h3 className="font-semibold text-xl text-gray-900">Smart Analytics</h3>
            <p className="text-gray-600">Visualize spending patterns and track your financial progress with beautiful charts</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-5 border border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={32} className="text-indigo-600"/>
            </div>
            <h3 className="font-semibold text-xl text-gray-900">Secure & Private</h3>
            <p className="text-gray-600">Bank-level security with encryption to keep your financial data protected</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-5 border border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Smartphone size={32} className="text-indigo-600"/>
            </div>
            <h3 className="font-semibold text-xl text-gray-900">Mobile Ready</h3>
            <p className="text-gray-600">Access your finances anywhere with our responsive mobile app</p>
          </div>
          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-5 border border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Globe size={32} className="text-indigo-600"/>
            </div>
            <h3 className="font-semibold text-xl text-gray-900">Global Support</h3>
            <p className="text-gray-600">Multi-currency support for international users and expenses</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Financial Life?</h2>
          <p className="text-indigo-100 text-xl max-w-2xl mx-auto mb-10">
            Join thousands of users who have taken control of their finances with FinanceTracker
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2 font-medium shadow-lg"
          >
            Get Started For Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold">FinanceTracker</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Heegan Technology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}