import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  HelpCircle,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isMobileOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grades', label: 'Grades & Results', icon: GraduationCap },
    { id: 'fees', label: 'Fees Balance', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    // { id: 'reports', label: 'Report Cards', icon: FileText },
    { id: 'family', label: 'Family Profile', icon: Users },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:transform-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full pt-20 lg:pt-6">
          {/* Main Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Main Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;


// import React from 'react';
// import {
//   LayoutDashboard,
//   GraduationCap,
//   ClipboardList,
//   Calendar,
//   MessageSquare,
//   FileText,
//   Users,
//   HelpCircle
// } from 'lucide-react';

// interface SidebarProps {
//   activeTab: string;
//   onTabChange: (tab: string) => void;
//   isMobileOpen: boolean;
//   onClose: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isMobileOpen, onClose }) => {
//   const menuItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { id: 'grades', label: 'Grades & Results', icon: GraduationCap },
//     { id: 'attendance', label: 'Attendance', icon: Calendar },
//     { id: 'messages', label: 'Messages', icon: MessageSquare },
//     { id: 'reports', label: 'Report Cards', icon: FileText },

//   ];

//   const bottomItems = [
//     { id: 'family', label: 'Family Profile', icon: Users },
//     { id: 'help', label: 'Help & Support', icon: HelpCircle },
//   ];

//   const handleTabClick = (tabId: string) => {
//     onTabChange(tabId);
//     onClose();
//   };

//   return (
//     <>
//       {/* Mobile Overlay */}
//       {isMobileOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:transform-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
//           }`}
//       >
//         <div className="flex flex-col h-full pt-20 lg:pt-6">
//           {/* Main Navigation */}
//           <nav className="flex-1 px-4 space-y-1">
//             <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
//               Main Menu
//             </p>
//             {menuItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = activeTab === item.id;
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => handleTabClick(item.id)}
//                   className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
//                     ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
//                     : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                 >
//                   <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
//                   <span className="font-medium">{item.label}</span>
//                 </button>
//               );
//             })}
//           </nav>

//           {/* Bottom Navigation */}
//           <div className="px-4 pb-6 space-y-1">
//             <hr className="my-4 border-gray-100" />
//             {bottomItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = activeTab === item.id;
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => handleTabClick(item.id)}
//                   className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
//                     ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
//                     : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                 >
//                   <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
//                   <span className="font-medium">{item.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// };

// export default Sidebar;
