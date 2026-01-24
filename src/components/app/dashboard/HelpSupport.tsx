import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, MessageCircle, Phone, Mail, FileText, HelpCircle, BookOpen, Video } from 'lucide-react';

const HelpSupport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const faqs = [
    {
      category: 'grades',
      question: 'How are grades calculated?',
      answer: 'Grades are calculated based on a weighted average of assignments, quizzes, tests, and participation. Each teacher may have different weighting for their class. You can view the breakdown by clicking on individual subjects.',
    },
    {
      category: 'grades',
      question: 'When are report cards released?',
      answer: 'Report cards are typically released at the end of each quarter. You will receive a notification when they are available for download in the Report Cards section.',
    },
    {
      category: 'attendance',
      question: 'How do I report an absence?',
      answer: 'You can report an absence by contacting the school office directly or through the messaging system in this portal. Please provide the date and reason for the absence.',
    },
    {
      category: 'attendance',
      question: 'What counts as an excused absence?',
      answer: 'Excused absences include illness with a doctor\'s note, family emergencies, religious observances, and pre-approved educational activities. Please contact the school office for specific policies.',
    },
    {
      category: 'assignments',
      question: 'How can I see upcoming assignments?',
      answer: 'Navigate to the Assignments section to view all upcoming, pending, and completed assignments. You can filter by subject and due date.',
    },
    {
      category: 'technical',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click on "Forgot Password" on the login page and enter your email address. You will receive a link to reset your password within a few minutes.',
    },
    {
      category: 'technical',
      question: 'The portal is not loading properly. What should I do?',
      answer: 'Try clearing your browser cache and cookies, then refresh the page. If the issue persists, try using a different browser or contact technical support.',
    },
    {
      category: 'communication',
      question: 'How do I contact my child\'s teacher?',
      answer: 'You can send messages to teachers through the Messages section. Select the teacher from the list and compose your message. Teachers typically respond within 24-48 hours.',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'grades', label: 'Grades & Results', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'communication', label: 'Communication', icon: MessageCircle },
    { id: 'technical', label: 'Technical Issues', icon: Video },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const contactOptions = [
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri, 8am-5pm',
      action: '(555) 123-4567',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Response within 24hrs',
      action: 'support@educonnect.com',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available now',
      action: 'Start Chat',
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-500">Find answers to common questions or contact us for assistance</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {contactOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <button
              key={index}
              onClick={() => alert(`Contacting via: ${option.action}`)}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{option.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{option.description}</p>
              <p className="text-sm font-medium text-blue-600">{option.action}</p>
            </button>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-500">{filteredFaqs.length} questions found</p>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 -mt-2">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredFaqs.length === 0 && (
              <div className="p-12 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No questions found matching your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
        <p className="text-blue-100 mb-6 max-w-xl mx-auto">
          Our support team is here to help you with any questions or issues you may have.
        </p>
        <button
          onClick={() => alert('Opening support ticket form...')}
          className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Submit a Support Ticket
        </button>
      </div>
    </div>
  );
};

export default HelpSupport;
