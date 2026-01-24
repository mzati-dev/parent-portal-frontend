import React, { useState } from 'react';
import { Send, Paperclip, Search, ChevronRight, User } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  avatar?: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
}

interface MessageCenterProps {
  messages: Message[];
}

const MessageCenter: React.FC<MessageCenterProps> = ({ messages }) => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(messages[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');

  const filteredMessages = messages.filter(
    msg => msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendReply = () => {
    if (replyText.trim()) {
      alert(`Reply sent: "${replyText}"`);
      setReplyText('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-500">Communicate with teachers</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[500px]">
        {/* Message List */}
        <div className={`lg:w-1/3 border-r border-gray-100 ${selectedMessage ? 'hidden lg:block' : ''}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          {/* Messages */}
          <div className="overflow-y-auto h-[calc(100%-73px)]">
            {filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${message.unread ? 'bg-blue-50/50' : ''
                  } ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {message.sender.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-gray-900 truncate ${message.unread ? 'font-semibold' : ''}`}>
                        {message.sender}
                      </p>
                      <span className="text-xs text-gray-500">{message.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                    <p className="text-xs text-gray-400 truncate mt-1">{message.preview}</p>
                  </div>
                  {message.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className={`flex-1 flex flex-col ${!selectedMessage ? 'hidden lg:flex' : ''}`}>
          {selectedMessage ? (
            <>
              {/* Back button (mobile) */}
              <button
                onClick={() => setSelectedMessage(null)}
                className="lg:hidden flex items-center gap-2 p-4 border-b border-gray-100 text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to messages
              </button>
              {/* Message Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedMessage.sender}</h3>
                    <p className="text-sm text-gray-500">{selectedMessage.senderRole}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{selectedMessage.subject}</p>
                  </div>
                </div>
              </div>
              {/* Message Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed">{selectedMessage.preview}</p>
              </div>
              {/* Reply Box */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                    <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendReply}
                    className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;


// import React, { useState } from 'react';
// import { Send, Paperclip, Search, ChevronRight, User, Calendar, Clock, Reply, Archive, Star } from 'lucide-react';

// interface Message {
//   id: string;
//   sender: string;
//   senderRole: string;
//   avatar?: string;
//   subject: string;
//   preview: string;
//   date: string;
//   unread: boolean;
//   category?: 'academic' | 'behavior' | 'attendance' | 'general';
// }

// interface MessageCenterProps {
//   messages: Message[];
// }

// const MessageCenter: React.FC<MessageCenterProps> = ({ messages }) => {
//   const [selectedMessage, setSelectedMessage] = useState<Message | null>(messages[0] || null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [replyText, setReplyText] = useState('');
//   const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'behavior'>('all');

//   const filteredMessages = messages.filter(msg => {
//     const matchesSearch = msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filter === 'all' ? true :
//       filter === 'unread' ? msg.unread :
//         filter === msg.category;
//     return matchesSearch && matchesFilter;
//   });

//   const getCategoryColor = (category?: string) => {
//     switch (category) {
//       case 'academic':
//         return 'bg-blue-100 text-blue-700';
//       case 'behavior':
//         return 'bg-green-100 text-green-700';
//       case 'attendance':
//         return 'bg-amber-100 text-amber-700';
//       default:
//         return 'bg-gray-100 text-gray-700';
//     }
//   };

//   const getCategoryIcon = (category?: string) => {
//     switch (category) {
//       case 'academic':
//         return '📚';
//       case 'behavior':
//         return '👍';
//       case 'attendance':
//         return '📅';
//       default:
//         return '✉️';
//     }
//   };

//   const handleSendReply = () => {
//     if (replyText.trim()) {
//       alert(`Reply sent to ${selectedMessage?.sender}: "${replyText}"`);
//       setReplyText('');
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//       {/* Header */}
//       <div className="p-6 border-b border-gray-100">
//         <div>
//           <h2 className="text-xl font-semibold text-gray-900">Messages from Teachers</h2>
//           <p className="text-sm text-gray-500 mt-1">Communicate directly with your child's teachers</p>
//         </div>
//       </div>

//       <div className="flex flex-col lg:flex-row h-[600px]">
//         {/* Left Sidebar - Message List */}
//         <div className={`lg:w-2/5 border-r border-gray-100 flex flex-col ${selectedMessage ? 'hidden lg:flex' : ''}`}>
//           {/* Search and Filters */}
//           <div className="p-4 border-b border-gray-100 space-y-3">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search messages..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//               />
//             </div>

//             {/* Filter Tabs */}
//             <div className="flex flex-wrap gap-2">
//               {[
//                 { id: 'all', label: 'All', count: messages.length },
//                 { id: 'unread', label: 'Unread', count: messages.filter(m => m.unread).length },
//                 { id: 'academic', label: 'Academic', count: messages.filter(m => m.category === 'academic').length },
//                 { id: 'behavior', label: 'Behavior', count: messages.filter(m => m.category === 'behavior').length }
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setFilter(tab.id as any)}
//                   className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${filter === tab.id
//                       ? 'bg-blue-50 text-blue-700 border border-blue-200'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
//                     }`}
//                 >
//                   {tab.label}
//                   {tab.count > 0 && (
//                     <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
//                       }`}>
//                       {tab.count}
//                     </span>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Messages List */}
//           <div className="flex-1 overflow-y-auto">
//             {filteredMessages.map((message) => (
//               <button
//                 key={message.id}
//                 onClick={() => setSelectedMessage(message)}
//                 className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${message.unread ? 'bg-blue-50/50' : ''
//                   } ${selectedMessage?.id === message.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''}`}
//               >
//                 <div className="flex items-start gap-3">
//                   {/* Avatar with Category */}
//                   <div className="relative">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
//                       {message.sender.charAt(0)}
//                     </div>
//                     <span className="absolute -top-1 -right-1 text-xs bg-white rounded-full p-0.5">
//                       {getCategoryIcon(message.category)}
//                     </span>
//                   </div>

//                   {/* Message Info */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <div className="flex items-center gap-2">
//                         <p className={`font-medium text-gray-900 truncate ${message.unread ? 'font-semibold' : ''}`}>
//                           {message.sender}
//                         </p>
//                         {message.category && (
//                           <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(message.category)}`}>
//                             {message.category}
//                           </span>
//                         )}
//                       </div>
//                       <div className="flex items-center gap-2">
//                         {message.unread && (
//                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                         )}
//                         <span className="text-xs text-gray-500 whitespace-nowrap">{message.date}</span>
//                       </div>
//                     </div>

//                     <p className="text-sm font-medium text-gray-800 truncate mb-1">{message.subject}</p>
//                     <p className="text-sm text-gray-500 line-clamp-2">{message.preview}</p>

//                     {/* Quick Actions */}
//                     <div className="flex items-center gap-2 mt-2">
//                       <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
//                         <Reply className="w-3 h-3" />
//                         Reply
//                       </button>
//                       <span className="text-gray-300">•</span>
//                       <button className="text-xs text-gray-500 hover:text-amber-600 flex items-center gap-1">
//                         <Star className="w-3 h-3" />
//                         Star
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             ))}

//             {filteredMessages.length === 0 && (
//               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
//                 <User className="w-12 h-12 mb-3" />
//                 <p>No messages found</p>
//                 <p className="text-sm mt-1">Try a different search or filter</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Side - Message Detail */}
//         <div className={`flex-1 flex flex-col ${!selectedMessage ? 'hidden lg:flex' : ''}`}>
//           {selectedMessage ? (
//             <>
//               {/* Back button (mobile) */}
//               <button
//                 onClick={() => setSelectedMessage(null)}
//                 className="lg:hidden flex items-center gap-2 p-4 border-b border-gray-100 text-gray-600 hover:text-gray-900"
//               >
//                 <ChevronRight className="w-4 h-4 rotate-180" />
//                 Back to messages
//               </button>

//               {/* Message Header */}
//               <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start gap-4">
//                     <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-lg">
//                       {selectedMessage.sender.charAt(0)}
//                     </div>
//                     <div>
//                       <div className="flex items-center gap-2 mb-1">
//                         <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.sender}</h3>
//                         {selectedMessage.category && (
//                           <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedMessage.category)}`}>
//                             {selectedMessage.category.charAt(0).toUpperCase() + selectedMessage.category.slice(1)}
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-sm text-gray-600">{selectedMessage.senderRole}</p>
//                       <p className="text-base font-medium text-gray-800 mt-2">{selectedMessage.subject}</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <span className="text-sm text-gray-600 flex items-center gap-1">
//                       <Calendar className="w-4 h-4" />
//                       {selectedMessage.date}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex items-center gap-2 mt-4">
//                   <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
//                     <Reply className="w-4 h-4" />
//                     Reply
//                   </button>
//                   <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
//                     <Archive className="w-4 h-4" />
//                     Archive
//                   </button>
//                   <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
//                     <Star className="w-4 h-4" />
//                     Star
//                   </button>
//                 </div>
//               </div>

//               {/* Message Content */}
//               <div className="flex-1 p-6 overflow-y-auto">
//                 <div className="max-w-3xl">
//                   <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
//                     <p className="text-gray-700 leading-relaxed whitespace-pre-line">
//                       {selectedMessage.preview}
//                     </p>
//                   </div>

//                   <div className="space-y-4">
//                     <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
//                       <h4 className="font-medium text-blue-900 mb-2">📚 Academic Progress</h4>
//                       <p className="text-sm text-blue-800">
//                         Your child has shown excellent improvement in Mathematics this term.
//                         Their problem-solving skills have developed significantly.
//                       </p>
//                     </div>

//                     <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
//                       <h4 className="font-medium text-amber-900 mb-2">📅 Attendance Note</h4>
//                       <p className="text-sm text-amber-800">
//                         Please note there were 2 late arrivals this month.
//                         School starts promptly at 8:00 AM.
//                       </p>
//                     </div>

//                     <div className="p-4 bg-green-50 rounded-xl border border-green-100">
//                       <h4 className="font-medium text-green-900 mb-2">👍 Positive Behavior</h4>
//                       <p className="text-sm text-green-800">
//                         Your child has been very helpful to classmates and shows great leadership
//                         in group activities.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
//                     <h4 className="font-medium text-gray-900 mb-2">📋 Next Steps</h4>
//                     <ul className="space-y-1 text-sm text-gray-700">
//                       <li>• Continue practicing multiplication tables at home</li>
//                       <li>• Ensure library books are returned by Friday</li>
//                       <li>• Parent-teacher meeting available next week</li>
//                     </ul>
//                   </div>

//                   <p className="text-gray-700 mt-6">Best regards,<br /><strong>{selectedMessage.sender}</strong><br />{selectedMessage.senderRole}</p>
//                 </div>
//               </div>

//               {/* Reply Box */}
//               <div className="p-6 border-t border-gray-100 bg-gray-50">
//                 <div className="max-w-3xl mx-auto">
//                   <div className="flex items-end gap-3">
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Write your reply to {selectedMessage.sender}:
//                       </label>
//                       <div className="relative">
//                         <textarea
//                           value={replyText}
//                           onChange={(e) => setReplyText(e.target.value)}
//                           placeholder="Type your message here..."
//                           rows={3}
//                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
//                         />
//                         <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
//                           <Paperclip className="w-4 h-4" />
//                         </button>
//                       </div>
//                       <div className="flex items-center justify-between mt-2">
//                         <p className="text-xs text-gray-500">
//                           Your reply will be sent directly to {selectedMessage.sender}
//                         </p>
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => setReplyText('')}
//                             className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
//                           >
//                             Clear
//                           </button>
//                           <button
//                             onClick={handleSendReply}
//                             disabled={!replyText.trim()}
//                             className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${replyText.trim()
//                                 ? 'bg-blue-600 text-white hover:bg-blue-700'
//                                 : 'bg-gray-200 text-gray-400 cursor-not-allowed'
//                               }`}
//                           >
//                             <Send className="w-4 h-4" />
//                             Send Reply
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               <div className="text-center">
//                 <User className="w-20 h-20 mx-auto mb-4 text-gray-300" />
//                 <p className="text-lg font-medium text-gray-900">Select a message</p>
//                 <p className="text-sm text-gray-500 mt-1">Choose a message from the list to read and reply</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MessageCenter;

// // import React, { useState } from 'react';
// // import { Send, Paperclip, Search, ChevronRight, User } from 'lucide-react';

// // interface Message {
// //   id: string;
// //   sender: string;
// //   senderRole: string;
// //   avatar?: string;
// //   subject: string;
// //   preview: string;
// //   date: string;
// //   unread: boolean;
// // }

// // interface Announcement {
// //   id: string;
// //   title: string;
// //   content: string;
// //   date: string;
// //   category: string;
// // }

// // interface MessageCenterProps {
// //   messages: Message[];
// //   announcements: Announcement[];
// // }

// // const MessageCenter: React.FC<MessageCenterProps> = ({ messages, announcements }) => {
// //   const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
// //   const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [replyText, setReplyText] = useState('');

// //   const filteredMessages = messages.filter(
// //     msg => msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //            msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
// //   );

// //   const getCategoryColor = (category: string) => {
// //     switch (category) {
// //       case 'Academic':
// //         return 'bg-blue-100 text-blue-700';
// //       case 'Event':
// //         return 'bg-purple-100 text-purple-700';
// //       case 'Important':
// //         return 'bg-red-100 text-red-700';
// //       case 'General':
// //         return 'bg-gray-100 text-gray-700';
// //       default:
// //         return 'bg-gray-100 text-gray-700';
// //     }
// //   };

// //   const handleSendReply = () => {
// //     if (replyText.trim()) {
// //       alert(`Reply sent: "${replyText}"`);
// //       setReplyText('');
// //     }
// //   };

// //   return (
// //     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
// //       {/* Header */}
// //       <div className="p-6 border-b border-gray-100">
// //         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// //           <div>
// //             <h2 className="text-lg font-semibold text-gray-900">Communication Center</h2>
// //             <p className="text-sm text-gray-500">Stay connected with teachers and school</p>
// //           </div>
// //           {/* Tabs */}
// //           <div className="flex bg-gray-100 rounded-xl p-1">
// //             <button
// //               onClick={() => setActiveTab('messages')}
// //               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
// //                 activeTab === 'messages'
// //                   ? 'bg-white text-gray-900 shadow-sm'
// //                   : 'text-gray-600 hover:text-gray-900'
// //               }`}
// //             >
// //               Messages
// //               {messages.filter(m => m.unread).length > 0 && (
// //                 <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
// //                   {messages.filter(m => m.unread).length}
// //                 </span>
// //               )}
// //             </button>
// //             <button
// //               onClick={() => setActiveTab('announcements')}
// //               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
// //                 activeTab === 'announcements'
// //                   ? 'bg-white text-gray-900 shadow-sm'
// //                   : 'text-gray-600 hover:text-gray-900'
// //               }`}
// //             >
// //               Announcements
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {activeTab === 'messages' && (
// //         <div className="flex flex-col lg:flex-row h-[500px]">
// //           {/* Message List */}
// //           <div className={`lg:w-1/3 border-r border-gray-100 ${selectedMessage ? 'hidden lg:block' : ''}`}>
// //             {/* Search */}
// //             <div className="p-4 border-b border-gray-100">
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
// //                 <input
// //                   type="text"
// //                   placeholder="Search messages..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
// //                 />
// //               </div>
// //             </div>
// //             {/* Messages */}
// //             <div className="overflow-y-auto h-[calc(100%-73px)]">
// //               {filteredMessages.map((message) => (
// //                 <button
// //                   key={message.id}
// //                   onClick={() => setSelectedMessage(message)}
// //                   className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
// //                     message.unread ? 'bg-blue-50/50' : ''
// //                   } ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''}`}
// //                 >
// //                   <div className="flex items-start gap-3">
// //                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium flex-shrink-0">
// //                       {message.sender.charAt(0)}
// //                     </div>
// //                     <div className="flex-1 min-w-0">
// //                       <div className="flex items-center justify-between">
// //                         <p className={`font-medium text-gray-900 truncate ${message.unread ? 'font-semibold' : ''}`}>
// //                           {message.sender}
// //                         </p>
// //                         <span className="text-xs text-gray-500">{message.date}</span>
// //                       </div>
// //                       <p className="text-sm text-gray-600 truncate">{message.subject}</p>
// //                       <p className="text-xs text-gray-400 truncate mt-1">{message.preview}</p>
// //                     </div>
// //                     {message.unread && (
// //                       <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
// //                     )}
// //                   </div>
// //                 </button>
// //               ))}
// //             </div>
// //           </div>

// //           {/* Message Detail */}
// //           <div className={`flex-1 flex flex-col ${!selectedMessage ? 'hidden lg:flex' : ''}`}>
// //             {selectedMessage ? (
// //               <>
// //                 {/* Back button (mobile) */}
// //                 <button
// //                   onClick={() => setSelectedMessage(null)}
// //                   className="lg:hidden flex items-center gap-2 p-4 border-b border-gray-100 text-gray-600 hover:text-gray-900"
// //                 >
// //                   <ChevronRight className="w-4 h-4 rotate-180" />
// //                   Back to messages
// //                 </button>
// //                 {/* Message Header */}
// //                 <div className="p-4 border-b border-gray-100">
// //                   <div className="flex items-start gap-3">
// //                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
// //                       {selectedMessage.sender.charAt(0)}
// //                     </div>
// //                     <div>
// //                       <h3 className="font-semibold text-gray-900">{selectedMessage.sender}</h3>
// //                       <p className="text-sm text-gray-500">{selectedMessage.senderRole}</p>
// //                       <p className="text-sm font-medium text-gray-700 mt-1">{selectedMessage.subject}</p>
// //                     </div>
// //                   </div>
// //                 </div>
// //                 {/* Message Content */}
// //                 <div className="flex-1 p-4 overflow-y-auto">
// //                   <p className="text-gray-700 leading-relaxed">{selectedMessage.preview}</p>
// //                   <p className="text-gray-700 leading-relaxed mt-4">
// //                     I wanted to reach out regarding your child's recent progress in class. They have been showing great improvement and I'm very pleased with their participation.
// //                   </p>
// //                   <p className="text-gray-700 leading-relaxed mt-4">
// //                     Please feel free to reach out if you have any questions or would like to schedule a meeting to discuss further.
// //                   </p>
// //                   <p className="text-gray-700 mt-4">Best regards,<br/>{selectedMessage.sender}</p>
// //                 </div>
// //                 {/* Reply Box */}
// //                 <div className="p-4 border-t border-gray-100">
// //                   <div className="flex items-end gap-3">
// //                     <div className="flex-1 relative">
// //                       <textarea
// //                         value={replyText}
// //                         onChange={(e) => setReplyText(e.target.value)}
// //                         placeholder="Type your reply..."
// //                         rows={2}
// //                         className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
// //                       />
// //                       <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
// //                         <Paperclip className="w-4 h-4" />
// //                       </button>
// //                     </div>
// //                     <button
// //                       onClick={handleSendReply}
// //                       className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
// //                     >
// //                       <Send className="w-5 h-5" />
// //                     </button>
// //                   </div>
// //                 </div>
// //               </>
// //             ) : (
// //               <div className="flex-1 flex items-center justify-center text-gray-400">
// //                 <div className="text-center">
// //                   <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
// //                   <p>Select a message to view</p>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       )}

// //       {activeTab === 'announcements' && (
// //         <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
// //           {announcements.map((announcement) => (
// //             <div
// //               key={announcement.id}
// //               className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
// //             >
// //               <div className="flex items-start justify-between gap-4">
// //                 <div>
// //                   <div className="flex items-center gap-2 mb-2">
// //                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(announcement.category)}`}>
// //                       {announcement.category}
// //                     </span>
// //                     <span className="text-xs text-gray-500">{announcement.date}</span>
// //                   </div>
// //                   <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
// //                   <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
// //                 </div>
// //                 <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default MessageCenter;
