
import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  return (
    <div className="relative mx-auto border-[#2a2a2a] bg-[#0d0d0d] border-[8px] rounded-[2.5rem] h-[800px] w-[380px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
      
      {/* Notch / Dynamic Island */}
      <div className="absolute top-0 inset-x-0 h-6 bg-[#0a0a0a] z-50 flex justify-center">
        <div className="h-5 w-32 bg-black rounded-b-xl"></div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#1a1a1a] text-[#e5e5e5] px-6 pt-2 pb-1 flex justify-between items-center text-xs font-medium z-40 select-none border-b border-[#2a2a2a]">
        <span className="pl-1">9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal size={12} />
          <Wifi size={12} />
          <Battery size={14} />
        </div>
      </div>

      {/* Screen Content - scrollbar-hide added */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d0d] relative scrollbar-hide">
        {children}
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-1 inset-x-0 flex justify-center pb-2 pt-4 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none z-50">
        <div className="w-32 h-1 bg-[#e5e5e5]/20 rounded-full"></div>
      </div>
    </div>
  );
};
