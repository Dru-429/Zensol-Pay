import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_AVATAR } from '../lib/api.js';

const RupeeIcon = ({ className }) => (
  <div className={`flex items-center justify-center rounded-full border-2 border-current w-6 h-6 ${className}`}>
    <span className="text-[12px] font-bold leading-none mt-[1px]">₹</span>
  </div>
);

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  // Hide Navbar on specific routes as requested: 
  // "except at chat(transfer interface) and search interface"
  const hideOnRoutes = ['/transfer', '/search'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));

  if (!user || shouldHide) return null;

  const navItems = [
    {
      label: 'Home',
      icon: (isActive) => (
        <div className={`p-1 px-5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#D1E9FF] text-[#004A77]' : 'text-[#44474E]'}`}>
          <Home className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
        </div>
      ),
      path: '/',
    },
    {
      label: 'Money',
      icon: (isActive) => (
        <div className={`p-1 px-5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#D1E9FF] text-[#004A77]' : 'text-[#44474E]'}`}>
          <RupeeIcon className="w-6 h-6" />
        </div>
      ),
      path: '/wallet',
    },
    // The user also mentioned chat(message icon) in the prompt, adding it.
    {
      label: 'Chat',
      icon: (isActive) => (
        <div className={`p-1 px-5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#D1E9FF] text-[#004A77]' : 'text-[#44474E]'}`}>
          <MessageCircle className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
        </div>
      ),
      path: '/chats',
    },
    {
      label: 'You',
      icon: (isActive) => (
        <div className={`p-1 px-5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#D1E9FF] text-[#004A77]' : 'text-[#44474E]'}`}>
          <img 
            src={user?.profile?.avatar_url || DEFAULT_AVATAR} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover" 
          />
        </div>
      ),
      path: `/profile/${user?.id}`,
    },
  ];

  return (
    <nav className="max-w-md mx-auto fixed bottom-0 left-0 right-0 bg-[#F0F4F9] border-t border-[#DDE3EA] py-2 pb-safe z-50">
      <div className="flex justify-around items-center max-w-md mx-auto ">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center gap-1 min-w-[64px] "
            >
              {item.icon(isActive)}
              <span className={`text-[12px] font-medium leading-none ${isActive ? 'text-[#001D35] font-bold' : 'text-[#44474E]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
