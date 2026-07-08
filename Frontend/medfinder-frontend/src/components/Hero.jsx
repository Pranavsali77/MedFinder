function Hero() {
  return (
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-12">
      {/* LEFT CONTENT */}
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Smart Medicine
        </h1>

        <h2 className="text-4xl font-semibold text-blue-600 mb-6">
          For Every Family
        </h2>

        <p className="text-gray-700 mb-8">
          MedFinder helps people instantly find medicines from nearby pharmacies
          with real-time availability, AI-powered alternative suggestions and
          emergency support.
        </p>

        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
          Search Medicine
        </button>
        
      </div>
    </div>
  );
}

export default Hero;
