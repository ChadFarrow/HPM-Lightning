// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  colorLoadTime: number;
  cacheHitRate: number;
  totalRequests: number;
  cacheHits: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    colorLoadTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  };

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (name === 'colorLoad') {
        this.metrics.colorLoadTime = duration;
        console.log(`🏃‍♂️ Color load time: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    };
  }

  recordCacheHit(): void {
    this.metrics.totalRequests++;
    this.metrics.cacheHits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    this.metrics.totalRequests++;
    this.updateCacheHitRate();
  }

  private updateCacheHitRate(): void {
    this.metrics.cacheHitRate = (this.metrics.cacheHits / this.metrics.totalRequests) * 100;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logMetrics(): void {
    console.log('🚀 Performance Metrics:', {
      avgColorLoadTime: `${this.metrics.colorLoadTime.toFixed(2)}ms`,
      cacheHitRate: `${this.metrics.cacheHitRate.toFixed(1)}%`,
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Mobile performance optimization utilities
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = window.navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouchSupport);
};

export const getMobileOptimizations = () => {
  const mobile = isMobile();
  
  return {
    // Reduce image quality on mobile for faster loading
    imageQuality: mobile ? 75 : 90,
    
    // Use smaller image sizes on mobile
    maxImageWidth: mobile ? 400 : 800,
    
    // Debounce color loading on mobile
    colorLoadDelay: mobile ? 150 : 0,
    
    // Preload fewer colors on mobile
    maxCacheSize: mobile ? 10 : 25,
    
    // Use CSS containment for better mobile performance
    cssContainment: mobile ? 'layout style paint' : 'none',
    
    // Enable hardware acceleration on mobile
    willChange: mobile ? 'transform, background' : 'auto'
  };
};

// Preload critical color data for instant loading
export const preloadCriticalColors = async (albumTitles: string[]) => {
  if (typeof window === 'undefined') return;
  
  const timer = performanceMonitor.startTimer('preload');
  
  try {
    const response = await fetch('/data/albums-with-colors.json');
    const data = await response.json();
    
    // Cache colors for critical albums
    const colorCache = new Map();
    
    albumTitles.forEach(title => {
      const album = data.albums?.find((a: any) => 
        a.title?.toLowerCase() === title.toLowerCase()
      );
      
      if (album?.colors) {
        colorCache.set(title.toLowerCase(), album.colors);
      }
    });
    
    console.log(`🚀 Preloaded ${colorCache.size} critical album colors`);
    
    // Store in global cache
    (window as any).__colorCache = colorCache;
    
  } catch (error) {
    console.error('Failed to preload colors:', error);
  } finally {
    timer();
  }
};

// Get cached color data without network request
export const getCachedColors = (albumTitle: string) => {
  if (typeof window === 'undefined') return null;
  
  const cache = (window as any).__colorCache as Map<string, any>;
  if (!cache) return null;
  
  const colors = cache.get(albumTitle.toLowerCase());
  if (colors) {
    performanceMonitor.recordCacheHit();
    return colors;
  }
  
  performanceMonitor.recordCacheMiss();
  return null;
};

// Lazy load non-critical data
export const createLazyLoader = (callback: () => Promise<void>, delay: number = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// Performance-optimized debounce for mobile
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};