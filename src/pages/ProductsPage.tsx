import React from 'react';

const ProductsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ყველა პროდუქტი</h1>

          {/* Filters */}
          <div className="flex gap-4">
            <select className="border rounded-lg px-4 py-2">
              <option>ყველა კატეგორია</option>
              <option>კატეგორია 1</option>
              <option>კატეგორია 2</option>
              <option>კატეგორია 3</option>
            </select>

            <select className="border rounded-lg px-4 py-2">
              <option>დაალაგება</option>
              <option>ფასით (ზრდადობით)</option>
              <option>ფასით (კლებადობით)</option>
              <option>სახელით</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">პროდუქტი {i}</h3>
                <p className="text-gray-600 text-sm mb-2">პროდუქტის აღწერა...</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">₾{(Math.random() * 100 + 50).toFixed(2)}</span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm">
                    კალათაში
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded hover:bg-gray-50">&laquo;</button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-2 border rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-2 border rounded hover:bg-gray-50">3</button>
            <button className="px-3 py-2 border rounded hover:bg-gray-50">&raquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;