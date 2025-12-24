// src/pages/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, Users, Sparkles, CheckCircle, 
  ArrowRight, Shield, Globe, Zap, 
  BarChart, Lock, Star, Target, Calendar,
  MessageSquare, Users as TeamIcon, TrendingUp,
  Calendar as CalendarIcon, Clock, Layout, FileText,
  PieChart, Bell, Cloud, Cpu, Maximize2, Zap as ZapIcon,
  TrendingUp as TrendingUpIcon, Users as UsersIcon
} from 'lucide-react';
import logo from '../assets/planytynewlogo.png';
import chatScreenshot from '../assets/chat.png';
import taskScreenshot from '../assets/task.png';
import workspaceScreenshot from '../assets/workspace.png';
import dashboardScreenshot from '../assets/dashboard.png';

// Import the CardSwap component
import CardSwap, { Card } from '../components/CardSwap';

// Animated Background Component
const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = [];
    const particleTypes = [
      { emoji: '📅', color: '#8B5CF6' },
      { emoji: '✅', color: '#10B981' },
      { emoji: '📊', color: '#3B82F6' },
      { emoji: '🤝', color: '#EC4899' },
      { emoji: '🎯', color: '#F59E0B' },
      { emoji: '⚡', color: '#F97316' },
      { emoji: '📈', color: '#8B5CF6' },
      { emoji: '📝', color: '#EC4899' },
    ];
    
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 15,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.3 + 0.1,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.02)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.03)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY + Math.sin(Date.now() * 0.001 + particle.floatOffset) * 0.1;
        particle.rotation += particle.rotationSpeed;
        
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        
        ctx.fillStyle = `${particle.type.color}20`;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = `${particle.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.type.emoji, 0, 0);
        
        ctx.restore();
      });
      
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.setLineDash([5, 10]);
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        const y = (canvas.height / 4) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(Date.now() * 0.001 + i) * 10);
        ctx.lineTo(canvas.width, y + Math.sin(Date.now() * 0.001 + i + 1) * 10);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// Floating UI Elements Component
const FloatingElements = () => {
  const floatingIcons = [
    { Icon: CalendarIcon, color: 'from-purple-500 to-pink-500', delay: 0 },
    { Icon: Clock, color: 'from-blue-500 to-purple-500', delay: 0.5 },
    { Icon: Layout, color: 'from-pink-500 to-rose-500', delay: 1 },
    { Icon: FileText, color: 'from-indigo-500 to-purple-500', delay: 1.5 },
    { Icon: PieChart, color: 'from-purple-500 to-violet-500', delay: 2 },
    { Icon: Bell, color: 'from-rose-500 to-pink-500', delay: 2.5 },
    { Icon: Cloud, color: 'from-blue-400 to-cyan-400', delay: 3 },
    { Icon: Cpu, color: 'from-emerald-500 to-teal-500', delay: 3.5 },
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingIcons.map((icon, index) => (
        <div
          key={index}
          className="absolute animate-float"
          style={{
            left: `${10 + (index * 10) % 80}%`,
            top: `${20 + (index * 7) % 60}%`,
            animationDelay: `${icon.delay}s`,
            animationDuration: `${15 + index * 2}s`,
          }}
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${icon.color} flex items-center justify-center shadow-lg opacity-20`}>
            <icon.Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Animated Grid Background
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(to right, rgba(139, 92, 246, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
      maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
      animation: 'pulse 4s ease-in-out infinite',
    }} />
  </div>
);

const LandingPage = () => {
  const [activeCard, setActiveCard] = useState(0);
  
  // Use all unique screenshots including dashboard
  const screenshots = [
    workspaceScreenshot,
    taskScreenshot,
    chatScreenshot,
    dashboardScreenshot
  ];

  const handleCardClick = (index) => {
    setActiveCard(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-pink-50/20 relative overflow-hidden">
      <AnimatedBackground />
      <AnimatedGrid />
      <FloatingElements />
      
      <div className="relative z-10">
        {/* Enhanced Solid Navigation */}
        <nav className="border-b border-purple-200 bg-white sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-md opacity-30"></div>
                  <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-purple-200 shadow-sm">
                    <img 
                      src={logo} 
                      alt="Planyty" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Planyty
                  </span>
                
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
              
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden group flex items-center"
                >
                  <span className="relative z-10 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign up 
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section with CardSwap */}
        <section className="pt-12 pb-16 px-6 relative">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-300/5 to-pink-300/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left Column - Text Content */}
              <div className="text-left">
                {/* Enhanced Badge */}
                <div className="inline-flex items-center space-x-2 mb-6 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-full border border-purple-200 shadow-md animate-float">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-purple-500 animate-spin-slow" />
                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-sm opacity-30"></div>
                  </div>
                  <span className="text-sm font-semibold text-purple-700">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      10,000+
                    </span> teams worldwide
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                {/* Enhanced Main Heading */}
                <div className="mb-6">
                  <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight relative">
                    <span className="block text-gray-900 drop-shadow-sm">
                      Plan with{' '}
                      <span className="relative">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          clarity
                        </span>
                        <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                      </span>
                      .
                    </span>
                    <span className="block mt-4 text-4xl md:text-6xl">
                      <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient font-extrabold">
                        Achieve with Planyty.
                      </span>
                    </span>
                  </h1>
                </div>
                
                {/* Enhanced Tagline */}
                <div className="mb-8">
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-100 shadow-sm">
                    The intelligent workspace where plans turn into reality. 
                    <span className="block mt-2 text-purple-600 font-medium">
                      From strategic vision to daily execution, Planyty empowers teams to deliver exceptional results.
                    </span>
                  </p>
                </div>
                
                {/* Enhanced CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                  <Link
                    to="/onboard-company"
                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg flex items-center justify-center w-full sm:w-auto relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center">
                      <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                      Start planning free
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                  </Link>
                  
                  <Link
                    to="/login"
                    className="group px-8 py-4 bg-white text-gray-700 font-bold rounded-xl text-lg border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 w-full sm:w-auto flex items-center justify-center hover:scale-105 shadow-sm"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="group-hover:text-purple-600 transition-colors">
                        Already using Planyty?{' '}
                        <span className="font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Log in
                        </span>
                      </span>
                    </span>
                  </Link>
                </div>

                {/* Active Feature Indicator */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-purple-100 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                      activeCard === 0 ? 'from-purple-500 to-pink-500' :
                      activeCard === 1 ? 'from-green-500 to-emerald-500' :
                      activeCard === 2 ? 'from-blue-500 to-cyan-500' :
                      'from-purple-600 to-violet-600'
                    } flex items-center justify-center`}>
                      {activeCard === 0 ? <Layout className="w-6 h-6 text-white" /> :
                       activeCard === 1 ? <CheckCircle className="w-6 h-6 text-white" /> :
                       activeCard === 2 ? <MessageSquare className="w-6 h-6 text-white" /> :
                       <BarChart className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {activeCard === 0 ? "Smart Workspaces" :
                         activeCard === 1 ? "Task Management" :
                         activeCard === 2 ? "Team Chat" :
                         "Progress Dashboard"}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {activeCard === 0 ? "Organize projects, teams, and tasks in dedicated workspaces" :
                         activeCard === 1 ? "Track progress, assign owners, and set deadlines with ease" :
                         activeCard === 2 ? "Real-time collaboration with integrated chat and notifications" :
                         "Visual dashboards to track team performance and project velocity"}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3].map((index) => (
                      <button
                        key={index}
                        onClick={() => handleCardClick(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === activeCard 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8' 
                            : 'bg-purple-200 hover:bg-purple-300'
                        }`}
                        aria-label={`View card ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - CardSwap Component - LARGER CARDS */}
              <div className="relative h-[650px] -mt-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{ 
                    height: '650px', 
                    position: 'relative', 
                    width: '100%' 
                  }}>
                    <CardSwap
                      cardDistance={60}
                      verticalDistance={70}
                      delay={5000}
                      pauseOnHover={true}
                      onCardClick={handleCardClick}
                      width={500}
                      height={380}
                      skewAmount={5}
                      easing="elastic"
                    >
                      {screenshots.map((screenshot, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:scale-105 transition-transform duration-300 border-0 shadow-2xl"
                          onClick={() => handleCardClick(index)}
                        >
                          {/* EXPANDED CARD - Image covers ENTIRE area */}
                          <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden">
                            <img 
                              src={screenshot} 
                              alt={`Planyty Screenshot ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Card>
                      ))}
                    </CardSwap>
                  </div>
                </div>
                
                <div className="absolute -top-6 -right-6 w-48 h-48 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-64 h-64 bg-gradient-to-r from-purple-300/5 to-pink-300/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </section>

{/* Features Section - Checkerboard Pattern (White Background) */}
{/* Features Section - Checkerboard Pattern (White Background) */}
<section className="py-16 px-6 bg-white relative">
  <div className="absolute inset-0 opacity-5"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
  
  <div className="max-w-7xl mx-auto relative">
    <div className="text-center mb-16">
      <div className="inline-block mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto animate-bounce shadow-lg">
          <Zap className="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Everything your team needs to succeed
      </h2>
      <p className="text-gray-600 text-lg">
        Comprehensive tools for planning, execution, and collaboration
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
      {[
        // Row 1: Purple-White-Purple
        {
          icon: <Layout className="w-8 h-8" />,
          title: "Smart Workspaces",
          desc: "Organize projects, teams, and tasks in dedicated workspaces",
          isPurple: true
        },
        {
          icon: <CheckCircle className="w-8 h-8" />,
          title: "Task Management",
          desc: "Track progress, assign owners, and set deadlines with ease",
          isPurple: false
        },
        {
          icon: <MessageSquare className="w-8 h-8" />,
          title: "Team Chat",
          desc: "Real-time collaboration with integrated chat and notifications",
          isPurple: true
        },
        // Row 2: White-Purple-White
        {
          icon: <BarChart className="w-8 h-8" />,
          title: "Progress Dashboard",
          desc: "Visual analytics to track team performance and project velocity",
          isPurple: false
        },
        {
          icon: <TeamIcon className="w-8 h-8" />,
          title: "Team Collaboration",
          desc: "Real-time updates, comments, and notifications keep everyone aligned.",
          isPurple: true
        },
        {
          icon: <Shield className="w-8 h-8" />,
          title: "Enterprise Security",
          desc: "SSO, 2FA, and SOC2 compliance for enterprise peace of mind.",
          isPurple: false
        }
      ].map((feature, idx) => (
        <div 
          key={idx} 
          className={`p-8 rounded-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer relative overflow-hidden group shadow-lg hover:shadow-2xl
            ${feature.isPurple 
              ? 'text-white' 
              : 'text-gray-900 border border-gray-200'
            }`}
          style={{
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: feature.isPurple 
              ? 'linear-gradient(to right, #a855f7, #ec4899)'
              : '#ffffff',
          }}
          onMouseEnter={(e) => {
            if (feature.isPurple) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#1f2937';
            } else {
              e.currentTarget.style.background = 'linear-gradient(to right, #a855f7, #ec4899)';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (feature.isPurple) {
              e.currentTarget.style.background = 'linear-gradient(to right, #a855f7, #ec4899)';
              e.currentTarget.style.color = '#ffffff';
            } else {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#1f2937';
            }
          }}
        >
          {/* Content Container */}
          <div className="relative z-10">
            {/* Icon Container */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110
              ${feature.isPurple 
                ? 'bg-white/20 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 group-hover:bg-white/20'
              }`}>
              <div className="transition-all duration-500">
                {React.cloneElement(feature.icon, {
                  className: `w-8 h-8 transition-all duration-500
                    ${feature.isPurple 
                      ? 'text-white group-hover:text-purple-600' 
                      : 'text-purple-600 group-hover:text-white'
                    }`
                })}
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold mb-3 transition-all duration-500">
              {feature.title}
            </h3>
            
            {/* Description */}
            <p className={`transition-all duration-500
              ${feature.isPurple 
                ? 'text-white/90 group-hover:text-gray-600' 
                : 'text-gray-600 group-hover:text-white/90'
              }`}>
              {feature.desc}
            </p>
          </div>
          
          {/* Border Glow on Hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-500"></div>
        </div>
      ))}
    </div>

    {/* Animated Stats */}
    <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl p-12 mb-16 backdrop-blur-sm border border-purple-200/30 shadow-lg">
      <div className="grid md:grid-cols-4 gap-8 text-center">
        {[
          { number: "98%", label: "Team Satisfaction", icon: "😊" },
          { number: "40%", label: "Faster Delivery", icon: "⚡" },
          { number: "10K+", label: "Active Teams", icon: "👥" },
          { number: "99.9%", label: "Uptime", icon: "🔄" },
        ].map((stat, idx) => (
          <div key={idx} className="group">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {stat.number}
            </div>
            <div className="text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Final CTA */}
    <div className="text-center bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to achieve more with clarity?
        </h2>
        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of teams who use Planyty to turn their plans into reality.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboard-company"
            className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg group"
          >
            <span className="flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <span className="flex items-center justify-center">
              Book a Demo
              <CalendarIcon className="ml-2 w-5 h-5" />
            </span>
          </Link>
        </div>
        <p className="text-white/70 text-sm mt-8">
          No credit card required • Free for teams up to 10 • Cancel anytime
        </p>
      </div>
    </div>
  </div>
</section>
        {/* Footer */}
        <footer className="border-t border-purple-100/50 bg-white/80 backdrop-blur-sm py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-6 md:mb-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30"></div>
                  <img 
                    src={logo} 
                    alt="Planyty" 
                    className="w-10 h-10 object-contain relative"
                  />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Planyty
                  </span>
                  <p className="text-gray-500 text-sm mt-1">Plan with clarity. Achieve with Planyty.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-gray-600 mb-6 md:mb-0">
                {['About', 'Pricing', 'Blog', 'Careers', 'Help'].map((item, idx) => (
                  <a 
                    key={idx} 
                    href="#" 
                    className="hover:text-purple-600 transition-colors hover:scale-105 inline-block"
                  >
                    {item}
                  </a>
                ))}
              </div>
              
              <div className="text-gray-500 text-sm">
                © 2024 Planyty. All rights reserved.
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-purple-100 text-center text-gray-500 text-sm">
              <p className="flex items-center justify-center">
                <span className="animate-pulse">❤️</span>
                <span className="ml-2">Built for teams who value clarity and results</span>
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% auto;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;