import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api.service';
import '../styles/Testimonials.css';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, carousel
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const carouselRef = useRef(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  useEffect(() => {
    loadTestimonials();
    setAnimateCards(true);
  }, []);

  useEffect(() => {
    if (viewMode === 'carousel') {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [viewMode, activeCarouselIndex, testimonials.length]);

  const loadTestimonials = async () => {
    try {
      console.log('Fetching testimonials from API...');
      const response = await apiService.getTestimonials();
      console.log('Testimonials API response:', response);

      if (response.success && response.testimonials && response.testimonials.length > 0) {
        console.log(`Loaded ${response.testimonials.length} testimonials from database`);
        setTestimonials(response.testimonials);
      } else {
        console.log('No testimonials from API, using fallback data');
        setTestimonials(getFallbackTestimonials());
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      console.log('Using fallback testimonials due to error');
      setTestimonials(getFallbackTestimonials());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackTestimonials = () => [
    {
      name: "Sarah Johnson",
      position: "CEO",
      company: "TechStart Inc.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3",
      rating: 5,
      content: "Working with this developer was an absolute pleasure. They delivered our e-commerce platform ahead of schedule and exceeded all our expectations. The attention to detail and technical expertise is unmatched.",
      featured: true,
      verified: true,
      date: new Date('2025-01-15'),
      project: "E-commerce Platform",
      tags: ["React", "Node.js", "MongoDB"]
    },
    {
      name: "Michael Chen",
      position: "CTO",
      company: "InnovateTech Solutions",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3",
      rating: 5,
      content: "Exceptional work on our AI-powered analytics dashboard. The developer's ability to understand complex requirements and translate them into elegant solutions is remarkable. Highly recommended!",
      featured: true,
      verified: true,
      date: new Date('2025-02-20'),
      project: "AI Analytics Dashboard",
      tags: ["Python", "TensorFlow", "React"]
    },
    {
      name: "Emily Rodriguez",
      position: "Product Manager",
      company: "Digital Dynamics",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3",
      rating: 5,
      content: "The portfolio website they built for us is stunning. It perfectly captures our brand identity and has significantly increased our conversion rates. Professional, creative, and reliable.",
      featured: false,
      verified: true,
      date: new Date('2025-03-10'),
      project: "Portfolio Website",
      tags: ["React", "Tailwind", "Framer Motion"]
    },
    {
      name: "David Kim",
      position: "Founder",
      company: "StartupHub",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3",
      rating: 5,
      content: "Outstanding development work on our real-time chat application. The performance optimization and user experience improvements have been game-changing for our platform.",
      featured: false,
      verified: true,
      date: new Date('2025-04-05'),
      project: "Real-time Chat App",
      tags: ["Socket.io", "Express", "Redis"]
    },
    {
      name: "Jessica Taylor",
      position: "Marketing Director",
      company: "BrandBoost Agency",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3",
      rating: 5,
      content: "The weather app they developed is both beautiful and functional. Our users love the intuitive interface and accurate forecasts. A truly talented developer!",
      featured: false,
      verified: true,
      date: new Date('2025-05-12'),
      project: "Weather App",
      tags: ["React Native", "API Integration"]
    },
    {
      name: "Robert Anderson",
      position: "VP Engineering",
      company: "CloudScale Systems",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3",
      rating: 5,
      content: "Impressive work on our enterprise Java system. The microservices architecture they implemented has improved our scalability and performance significantly. Top-notch technical skills.",
      featured: false,
      verified: true,
      date: new Date('2025-06-18'),
      project: "Enterprise System",
      tags: ["Java", "Spring Boot", "Microservices"]
    },
    {
      name: "Amanda White",
      position: "Design Lead",
      company: "Creative Studios",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3",
      rating: 5,
      content: "Collaboration was seamless! They transformed our design mockups into pixel-perfect, performant web applications. Communication was excellent throughout.",
      featured: true,
      verified: true,
      date: new Date('2025-07-22'),
      project: "Design System Implementation",
      tags: ["React", "Storybook", "Design Systems"]
    },
    {
      name: "Chris Martinez",
      position: "Operations Manager",
      company: "LogiTech Solutions",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3",
      rating: 4,
      content: "Great experience working together. The inventory management system has streamlined our operations significantly. Would definitely work with them again!",
      featured: false,
      verified: true,
      date: new Date('2025-08-15'),
      project: "Inventory Management",
      tags: ["Vue.js", "Laravel", "MySQL"]
    }
  ];

  const filteredAndSortedTestimonials = testimonials
    .filter(testimonial => {
      const matchesSearch = testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimonial.project?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filter === 'all' ||
        (filter === 'featured' && testimonial.featured) ||
        (filter === 'verified' && testimonial.verified);

      const matchesRating = ratingFilter === 0 || testimonial.rating === ratingFilter;

      return matchesSearch && matchesFilter && matchesRating;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'company':
          comparison = (a.company || '').localeCompare(b.company || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTestimonials = filteredAndSortedTestimonials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedTestimonials.length / itemsPerPage);

  // Calculate statistics
  const stats = {
    total: testimonials.length,
    featured: testimonials.filter(t => t.featured).length,
    verified: testimonials.filter(t => t.verified).length,
    averageRating: testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : 0,
    ratingDistribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: testimonials.filter(t => t.rating === rating).length,
      percentage: testimonials.length > 0
        ? (testimonials.filter(t => t.rating === rating).length / testimonials.length * 100).toFixed(0)
        : 0
    })),
    recentCount: testimonials.filter(t => {
      const daysDiff = (new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? 'star-filled' : 'star-empty'} ${interactive ? 'star-interactive' : ''}`}
        onClick={() => interactive && setRatingFilter(i + 1)}
      ></i>
    ));
  };

  const openModal = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowModal(true);
    if (testimonial.rating === 5) {
      triggerConfetti();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedTestimonial(null), 300);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const nextSlide = () => {
    setActiveCarouselIndex((prev) => 
      prev === filteredAndSortedTestimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setActiveCarouselIndex((prev) => 
      prev === 0 ? filteredAndSortedTestimonials.length - 1 : prev - 1
    );
  };

  const exportTestimonials = () => {
    const dataStr = JSON.stringify(filteredAndSortedTestimonials, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `testimonials_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareTestimonial = async (testimonial) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Testimonial from ${testimonial.name}`,
          text: testimonial.content,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `"${testimonial.content}" - ${testimonial.name}, ${testimonial.position} @ ${testimonial.company}`
      );
      alert('Testimonial copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-bgColor flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="testimonial-loader-advanced">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-pulse"></div>
          </div>
          <p className="text-textColor/60 text-lg">Loading testimonials...</p>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.2}s` }}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-16 bg-bgColor relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#fbbf24'][Math.floor(Math.random() * 4)]
            }}></div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 mb-8 glass-badge">
            <span className="w-3 h-3 bg-mainColor rounded-full animate-pulse"></span>
            <span className="text-mainColor text-base font-bold tracking-widest uppercase">
              Client Testimonials 2025
            </span>
            <span className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="relative block animated-gradient-text">
              <span className="bg-gradient-to-r from-mainColor via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl">
                What Clients
              </span>
              <div className="gradient-underline gradient-underline-1"></div>
            </span>
            <span className="relative block mt-4 animated-gradient-text" style={{ animationDelay: '0.2s' }}>
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-mainColor bg-clip-text text-transparent drop-shadow-2xl">
                Are Saying
              </span>
              <div className="gradient-underline gradient-underline-2"></div>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-textColor/60 max-w-4xl mx-auto leading-relaxed font-light">
            Real feedback from <span className="text-mainColor font-semibold">{stats.total}+ amazing clients</span> I've had the pleasure to work with
          </p>

          {/* Decorative Quote Marks */}
          <div className="relative mt-8">
            <div className="flex justify-center gap-20 relative z-10">
              <div className="quote-mark quote-left">
                <i className="fas fa-quote-left"></i>
              </div>
              <div className="quote-mark quote-right">
                <i className="fas fa-quote-right"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Section */}
        {showStats && testimonials.length > 0 && (
          <div className="mb-10" data-aos="fade-up" data-aos-delay="200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="stat-card stat-card-blue">
                <div className="stat-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total Reviews</div>
                <div className="stat-sparkle"></div>
              </div>

              <div className="stat-card stat-card-yellow">
                <div className="stat-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-number">{stats.averageRating}</div>
                <div className="stat-label">Average Rating</div>
                <div className="stat-progress" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
              </div>

              <div className="stat-card stat-card-green">
                <div className="stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-number">{stats.featured}</div>
                <div className="stat-label">Featured</div>
                <div className="stat-sparkle"></div>
              </div>

              <div className="stat-card stat-card-purple">
                <div className="stat-icon">
                  <i className="fas fa-shield-check"></i>
                </div>
                <div className="stat-number">{stats.verified}</div>
                <div className="stat-label">Verified</div>
                <div className="stat-sparkle"></div>
              </div>

              <div className="stat-card stat-card-pink">
                <div className="stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-number">{stats.recentCount}</div>
                <div className="stat-label">This Month</div>
                <div className="stat-sparkle"></div>
              </div>
            </div>

            {/* Rating Distribution Chart */}
            <div className="mt-6 glass-panel p-6" data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-xl font-semibold text-textColor mb-4 flex items-center gap-2">
                <i className="fas fa-chart-bar text-mainColor"></i>
                Rating Distribution
              </h3>
              <div className="space-y-3">
                {stats.ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="rating-bar-container">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {renderStars(rating)}
                      </div>
                      <div className="flex-1">
                        <div className="rating-bar-bg">
                          <div 
                            className="rating-bar-fill" 
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="rating-bar-label">{count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-textColor/70 text-sm font-semibold min-w-[50px] text-right">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Search and Controls */}
        <div className="mb-6" data-aos="fade-up" data-aos-delay="300">
          <div className="glass-panel p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-mainColor"></i>
                <input
                  type="text"
                  placeholder="Search by name, company, content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-textColor/50 hover:text-textColor"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 items-center justify-center lg:justify-end">
                {/* View Mode Toggle */}
                <div className="btn-group">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`btn-group-item ${viewMode === 'grid' ? 'active' : ''}`}
                    title="Grid View"
                  >
                    <i className="fas fa-th"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`btn-group-item ${viewMode === 'list' ? 'active' : ''}`}
                    title="List View"
                  >
                    <i className="fas fa-list"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('carousel')}
                    className={`btn-group-item ${viewMode === 'carousel' ? 'active' : ''}`}
                    title="Carousel View"
                  >
                    <i className="fas fa-images"></i>
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="control-select"
                >
                  <option value="date">📅 Date</option>
                  <option value="rating">⭐ Rating</option>
                  <option value="name">👤 Name</option>
                  <option value="company">🏢 Company</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="control-btn"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <i className={`fas fa-sort-amount-${sortOrder === 'asc' ? 'down' : 'up'}-alt`}></i>
                </button>

                {/* Toggle Stats */}
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`control-btn ${showStats ? 'active' : ''}`}
                  title="Toggle Statistics"
                >
                  <i className="fas fa-chart-bar"></i>
                </button>

                {/* Export */}
                <button
                  onClick={exportTestimonials}
                  className="control-btn"
                  title="Export Testimonials"
                >
                  <i className="fas fa-download"></i>
                </button>

                {/* Refresh */}
                <button
                  onClick={loadTestimonials}
                  className="control-btn"
                  title="Refresh"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-4 items-center">
              <span className="text-textColor/70 text-sm font-semibold">Filters:</span>
              
              {/* Category Filters */}
              <div className="filter-pills">
                <button
                  onClick={() => setFilter('all')}
                  className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                >
                  <i className="fas fa-globe"></i>
                  All ({testimonials.length})
                </button>
                <button
                  onClick={() => setFilter('featured')}
                  className={`filter-pill ${filter === 'featured' ? 'active' : ''}`}
                >
                  <i className="fas fa-star"></i>
                  Featured ({stats.featured})
                </button>
                <button
                  onClick={() => setFilter('verified')}
                  className={`filter-pill ${filter === 'verified' ? 'active' : ''}`}
                >
                  <i className="fas fa-shield-check"></i>
                  Verified ({stats.verified})
                </button>
              </div>

              {/* Rating Filter */}
              <div className="filter-pills">
                <button
                  onClick={() => setRatingFilter(0)}
                  className={`filter-pill ${ratingFilter === 0 ? 'active' : ''}`}
                >
                  All Ratings
                </button>
                {[5, 4, 3].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating)}
                    className={`filter-pill ${ratingFilter === rating ? 'active' : ''}`}
                  >
                    {rating} <i className="fas fa-star text-yellow-500 text-xs"></i>
                  </button>
                ))}
              </div>

              {/* Clear Filters */}
              {(filter !== 'all' || ratingFilter !== 0 || searchTerm) && (
                <button
                  onClick={() => {
                    setFilter('all');
                    setRatingFilter(0);
                    setSearchTerm('');
                  }}
                  className="filter-pill clear-filter"
                >
                  <i className="fas fa-times"></i>
                  Clear All
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-4 text-textColor/60 text-sm">
              Showing {viewMode === 'carousel' ? 1 : currentTestimonials.length} of {filteredAndSortedTestimonials.length} testimonial{filteredAndSortedTestimonials.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Testimonials Display */}
        {filteredAndSortedTestimonials.length === 0 ? (
          /* Empty State */
          <div className="empty-state" data-aos="fade-up">
            <div className="empty-state-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3 className="empty-state-title">No testimonials found</h3>
            <p className="empty-state-text">
              {searchTerm
                ? `No results for "${searchTerm}". Try adjusting your search or filters.`
                : 'Try adjusting your filters to see more testimonials.'}
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setRatingFilter(0);
                setSearchTerm('');
              }}
              className="btn-primary mt-4"
            >
              <i className="fas fa-redo mr-2"></i>
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="testimonials-scrollable-container">
                <div className={`testimonials-grid ${animateCards ? 'animate' : ''}`}>
                {currentTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="testimonial-card-enhanced"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                    onClick={() => openModal(testimonial)}
                  >
                    {/* Card Header */}
                    <div className="card-header">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="card-avatar"
                      />
                      <div className="card-badges">
                        {testimonial.featured && (
                          <span className="badge badge-featured">
                            <i className="fas fa-star"></i>
                          </span>
                        )}
                        {testimonial.verified && (
                          <span className="badge badge-verified">
                            <i className="fas fa-shield-check"></i>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="card-rating">
                      {renderStars(testimonial.rating)}
                      <span className="rating-text">{testimonial.rating}.0</span>
                    </div>

                    {/* Content */}
                    <blockquote className="card-content">
                      <i className="fas fa-quote-left quote-icon-left"></i>
                      {testimonial.content}
                      <i className="fas fa-quote-right quote-icon-right"></i>
                    </blockquote>

                    {/* Client Info */}
                    <div className="card-client-info">
                      <div>
                        <h4 className="client-name">{testimonial.name}</h4>
                        <p className="client-position">
                          {testimonial.position}
                          {testimonial.company && (
                            <>
                              {' '}@ <span className="client-company">{testimonial.company}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Project Tags */}
                    {testimonial.tags && (
                      <div className="card-tags">
                        {testimonial.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="card-footer">
                      <div className="card-date">
                        <i className="far fa-calendar"></i>
                        {new Date(testimonial.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTestimonial(testimonial);
                        }}
                        className="card-share-btn"
                      >
                        <i className="fas fa-share-alt"></i>
                      </button>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="card-glow"></div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="testimonials-scrollable-container">
                <div className="testimonials-list">
                {currentTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="testimonial-list-item"
                    data-aos="fade-right"
                    data-aos-delay={index * 50}
                    onClick={() => openModal(testimonial)}
                  >
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="list-avatar"
                    />
                    <div className="list-content">
                      <div className="list-header">
                        <div>
                          <h4 className="list-name">
                            {testimonial.name}
                            {testimonial.verified && (
                              <i className="fas fa-shield-check text-green-500 text-sm ml-2"></i>
                            )}
                          </h4>
                          <p className="list-position">
                            {testimonial.position} @ {testimonial.company}
                          </p>
                        </div>
                        <div className="list-rating">
                          {renderStars(testimonial.rating)}
                        </div>
                      </div>
                      <p className="list-text">{testimonial.content}</p>
                      <div className="list-footer">
                        {testimonial.project && (
                          <span className="list-project">
                            <i className="fas fa-briefcase"></i>
                            {testimonial.project}
                          </span>
                        )}
                        <span className="list-date">
                          {new Date(testimonial.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareTestimonial(testimonial);
                      }}
                      className="list-share-btn"
                    >
                      <i className="fas fa-share-alt"></i>
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Carousel View */}
            {viewMode === 'carousel' && (
              <div className="testimonial-carousel" ref={carouselRef}>
                <button onClick={prevSlide} className="carousel-btn carousel-btn-prev">
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                <div className="carousel-container">
                  {filteredAndSortedTestimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className={`carousel-slide ${index === activeCarouselIndex ? 'active' : ''}`}
                      style={{
                        transform: `translateX(${(index - activeCarouselIndex) * 100}%)`
                      }}
                    >
                      <div className="carousel-content">
                        <div className="carousel-quote-mark">
                          <i className="fas fa-quote-left"></i>
                        </div>
                        <div className="carousel-rating">
                          {renderStars(testimonial.rating)}
                        </div>
                        <blockquote className="carousel-text">
                          {testimonial.content}
                        </blockquote>
                        <div className="carousel-client">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="carousel-avatar"
                          />
                          <div>
                            <h4 className="carousel-name">{testimonial.name}</h4>
                            <p className="carousel-position">
                              {testimonial.position} @ {testimonial.company}
                            </p>
                            {testimonial.project && (
                              <p className="carousel-project">
                                <i className="fas fa-briefcase"></i>
                                {testimonial.project}
                              </p>
                            )}
                          </div>
                          {testimonial.verified && (
                            <span className="carousel-verified">
                              <i className="fas fa-shield-check"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={nextSlide} className="carousel-btn carousel-btn-next">
                  <i className="fas fa-chevron-right"></i>
                </button>

                {/* Carousel Indicators */}
                <div className="carousel-indicators">
                  {filteredAndSortedTestimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveCarouselIndex(index)}
                      className={`carousel-indicator ${index === activeCarouselIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination (for grid and list views) */}
            {viewMode !== 'carousel' && totalPages > 1 && (
              <div className="pagination" data-aos="fade-up">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <i className="fas fa-chevron-left"></i>
                  Previous
                </button>

                <div className="pagination-numbers">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedTestimonial && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="modal-close">
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-header">
              <img
                src={selectedTestimonial.avatar}
                alt={selectedTestimonial.name}
                className="modal-avatar"
              />
              <div>
                <h3 className="modal-name">
                  {selectedTestimonial.name}
                  {selectedTestimonial.verified && (
                    <i className="fas fa-shield-check text-green-500 ml-2"></i>
                  )}
                </h3>
                <p className="modal-position">
                  {selectedTestimonial.position} @ {selectedTestimonial.company}
                </p>
              </div>
              {selectedTestimonial.featured && (
                <span className="badge badge-featured">
                  <i className="fas fa-star"></i>
                  Featured
                </span>
              )}
            </div>

            <div className="modal-rating">
              {renderStars(selectedTestimonial.rating)}
              <span className="rating-text">{selectedTestimonial.rating}.0 / 5.0</span>
            </div>

            <blockquote className="modal-quote">
              <i className="fas fa-quote-left quote-icon-large"></i>
              {selectedTestimonial.content}
              <i className="fas fa-quote-right quote-icon-large"></i>
            </blockquote>

            {selectedTestimonial.project && (
              <div className="modal-project">
                <i className="fas fa-briefcase"></i>
                <strong>Project:</strong> {selectedTestimonial.project}
              </div>
            )}

            {selectedTestimonial.tags && (
              <div className="modal-tags">
                <strong>Technologies:</strong>
                <div className="tags-container">
                  {selectedTestimonial.tags.map((tag, i) => (
                    <span key={i} className="tag tag-large">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <div className="modal-date">
                <i className="far fa-calendar"></i>
                {new Date(selectedTestimonial.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <button
                onClick={() => shareTestimonial(selectedTestimonial)}
                className="btn-primary"
              >
                <i className="fas fa-share-alt mr-2"></i>
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonials;