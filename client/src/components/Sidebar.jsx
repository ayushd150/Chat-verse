// import React, { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { User, Search, Filter } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";

// const Sidebar = () => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, typingUsers } = useAuthStore();
//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = React.useMemo(() => {
//     let filtered = Array.isArray(users) ? users : [];
    
//     // Filter by search term
//     if (searchTerm) {
//       filtered = filtered.filter((user) =>
//         user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
    
//     // Filter by online status
//     if (showOnlineOnly) {
//       filtered = filtered.filter((user) => onlineUsers.includes(user._id));
//     }
    
//     return filtered;
//   }, [users, searchTerm, showOnlineOnly, onlineUsers]);

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
//       {/* Header */}
//       <div className="border-b border-base-300 w-full p-5">
//         <div className="flex items-center gap-2">
//           <User size={24} />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>
//       </div>

//       {/* Search and Filter Section - Only visible on larger screens */}
//       <div className="p-3 space-y-3 hidden lg:block">
//         {/* Search Bar */}
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 size-4" />
//           <input
//             type="text"
//             placeholder="Search contacts..."
//             className="input input-bordered w-full pl-10 input-sm bg-base-200/50 focus:bg-base-100 transition-colors"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         {/* Online Filter Toggle */}
//         <div className="flex items-center justify-between bg-base-200/30 rounded-lg p-2">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-sm checkbox-primary"
//             />
//             <span className="text-sm font-medium">Show online only</span>
//           </label>
//           <div className="badge badge-primary badge-sm">
//             {onlineUsers.length - 1}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Filter Button */}
//       <div className="p-3 lg:hidden border-b border-base-300">
//         <button
//           onClick={() => setShowOnlineOnly(!showOnlineOnly)}
//           className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
//             showOnlineOnly ? "bg-primary text-primary-content" : "bg-base-200 hover:bg-base-300"
//           }`}
//         >
//           <Filter size={16} />
//           <span className="text-xs font-medium">
//             {showOnlineOnly ? "All" : "Online"}
//           </span>
//           <div className="badge badge-sm">
//             {showOnlineOnly ? users.length : onlineUsers.length - 1}
//           </div>
//         </button>
//       </div>

//       {/* Contacts List */}
//       <div className="overflow-y-auto w-full py-2 flex-1">
//         {filteredUsers.map((user) => (
//           <button
//             key={user._id}
//             onClick={() => setSelectedUser(user)}
//             className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-all duration-200
//               ${selectedUser?._id === user._id 
//                 ? "bg-base-300 ring-1 ring-primary/20 border-r-2 border-primary" 
//                 : "hover:scale-[1.02]"
//               }`}
//           >
//             {/* Avatar */}
//             <div className="relative mx-auto lg:mx-0 flex-shrink-0">
//               <img
//                 src={user.profilePic || "/avatar.jpg"}
//                 alt={user.fullName || "User"}
//                 className="size-12 object-cover rounded-full ring-2 ring-base-300"
//               />
//               {/* Online Status Indicator */}
//               {onlineUsers.includes(user._id) && (
//                 <span className="absolute bottom-0 right-0 size-3 bg-success rounded-full ring-2 ring-base-100 animate-pulse" />
//               )}
//             </div>

//             {/* User Info - Hidden on mobile */}
//             <div className="hidden lg:block text-left min-w-0 flex-1">
//               <div className="font-medium truncate text-base-content">
//                 {user.fullName}
//               </div>
//               <div className="text-sm text-base-content/70 flex items-center gap-1">
//                 {typingUsers.includes(user._id) ? (
//                   <span className="text-primary italic font-medium flex items-center gap-1">
//                     <span className="loading loading-dots loading-xs"></span>
//                     Typing...
//                   </span>
//                 ) : (
//                   <span className={`flex items-center gap-1 ${
//                     onlineUsers.includes(user._id) ? "text-success" : "text-base-content/50"
//                   }`}>
//                     <span className={`size-2 rounded-full ${
//                       onlineUsers.includes(user._id) ? "bg-success" : "bg-base-content/30"
//                     }`} />
//                     {onlineUsers.includes(user._id) ? "Online" : "Offline"}
//                   </span>
//                 )}
//               </div>
//             </div>
//           </button>
//         ))}

//         {/* Empty State */}
//         {filteredUsers.length === 0 && (
//           <div className="text-center py-8 px-4">
//             <div className="space-y-3">
//               <User className="size-16 mx-auto text-base-content/30" />
//               <div className="space-y-1">
//                 <p className="font-medium text-base-content/60 hidden lg:block">
//                   {searchTerm 
//                     ? "No contacts found" 
//                     : showOnlineOnly 
//                     ? "No online users" 
//                     : "No contacts yet"
//                   }
//                 </p>
//                 {searchTerm && (
//                   <p className="text-sm text-base-content/40 hidden lg:block">
//                     Try searching for something else
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    getUnreadCount 
  } = useChatStore();
  
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const unreadCount = getUnreadCount(user._id);
          
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors relative
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.jpg"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on large screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{user.fullName}</div>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-content text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>

              {/* Unread indicator for mobile - small dot */}
              {unreadCount > 0 && (
                <div className="lg:hidden absolute top-2 right-2">
                  <span className="bg-primary size-3 rounded-full"></span>
                </div>
              )}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;