export default function Page() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 shadow-sm sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-indigo-600">Prisma</span>
          <span className="text-2xl font-bold text-gray-800">Sosmed</span>
        </div>
        <div className="hidden md:flex gap-8 text-gray-600 font-medium">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Testimonials</a>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-indigo-600 font-semibold rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors">
            Log In
          </button>
          <button className="px-4 py-2 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
        <span className="px-4 py-1 mb-6 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full">
          🚀 Connect. Share. Inspire.
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl">
          Your World, <span className="text-indigo-600">One Post</span> at a Time
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-xl">
          PrismaSosmed is the modern social platform where you share moments, build communities, and discover stories that matter.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 text-white text-lg font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:-translate-y-0.5">
            Get Started — It's Free
          </button>
          <button className="px-8 py-4 text-indigo-600 text-lg font-semibold rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all hover:-translate-y-0.5">
            See How It Works
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required · Cancel anytime</p>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white px-6">
          {[
            { value: "2M+", label: "Active Users" },
            { value: "50M+", label: "Posts Shared" },
            { value: "120+", label: "Countries" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold">{stat.value}</div>
              <div className="mt-1 text-indigo-200 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">Everything You Need</h2>
          <p className="mt-4 text-lg text-gray-500">Powerful features to keep you connected and inspired.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📸",
              title: "Rich Media Posts",
              desc: "Share photos, videos, and stories with stunning filters and editing tools built right in.",
            },
            {
              icon: "🤝",
              title: "Build Your Network",
              desc: "Follow friends, join interest-based communities, and grow your audience organically.",
            },
            {
              icon: "🔔",
              title: "Smart Notifications",
              desc: "Stay on top of what matters with intelligent, prioritized notifications — not noise.",
            },
            {
              icon: "🔒",
              title: "Privacy First",
              desc: "Full control over who sees your content. Your data stays yours — always.",
            },
            {
              icon: "💬",
              title: "Real-Time Chat",
              desc: "Message friends with instant delivery, read receipts, and end-to-end encryption.",
            },
            {
              icon: "📊",
              title: "Creator Analytics",
              desc: "Deep insights into your reach, engagement, and audience growth over time.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all bg-white"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">Get Started in Minutes</h2>
          <p className="mt-4 text-lg text-gray-500">Three simple steps to join the community.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create Account", desc: "Sign up with your email in seconds. No forms, no fuss." },
            { step: "02", title: "Build Your Profile", desc: "Add a photo, write your bio, and pick your interests." },
            { step: "03", title: "Start Sharing", desc: "Post content, follow people, and join the conversation." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-2xl font-extrabold flex items-center justify-center mb-6 shadow-lg">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">Loved by Thousands</h2>
          <p className="mt-4 text-lg text-gray-500">Here's what our community has to say.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Rina Marlina",
              role: "Content Creator",
              avatar: "RM",
              quote: "PrismaSosmed has completely changed how I connect with my audience. The analytics alone are worth it!",
            },
            {
              name: "Budi Santoso",
              role: "Photographer",
              avatar: "BS",
              quote: "The image quality and editing tools are unmatched. This is now my go-to platform for sharing my work.",
            },
            {
              name: "Dewi Kusuma",
              role: "Community Manager",
              avatar: "DK",
              quote: "Building our brand community here has been seamless. The engagement features are truly powerful.",
            },
          ].map((t) => (
            <div key={t.name} className="p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl transition-all">
              <p className="text-gray-600 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600 text-center px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Ready to Join the Community?
        </h2>
        <p className="text-indigo-200 text-xl mb-10 max-w-xl mx-auto">
          Over 2 million people are already sharing, connecting, and growing on PrismaSosmed.
        </p>
        <button className="px-10 py-4 text-indigo-600 text-lg font-bold rounded-xl bg-white hover:bg-indigo-50 shadow-xl transition-all hover:-translate-y-1">
          Create Your Free Account
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-white font-bold text-xl">Prisma</span>
            <span className="text-indigo-400 font-bold text-xl">Sosmed</span>
            <p className="text-sm mt-1">Connect. Share. Inspire.</p>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} PrismaSosmed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}