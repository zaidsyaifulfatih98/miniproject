function EventSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
      <div className="w-full aspect-video bg-gray-300"></div>
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-4 sm:h-5 bg-gray-300 rounded-lg"></div>
        <div className="h-3 sm:h-4 bg-gray-300 rounded-lg w-3/4"></div>
        <div className="h-3 sm:h-4 bg-gray-300 rounded-lg w-2/3"></div>
        <div className="pt-2 sm:pt-3 border-t border-gray-100 flex justify-between">
          <div className="h-4 sm:h-5 bg-gray-300 rounded w-1/3"></div>
          <div className="h-7 sm:h-8 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export default function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventSkeleton key={i} />
      ))}
    </div>
  );
}
