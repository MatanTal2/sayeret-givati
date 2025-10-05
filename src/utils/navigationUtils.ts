/**
 * Navigation utility functions for the application
 */

import { TEXT_CONSTANTS } from '@/constants/text';

export interface FeatureRoute {
  title: string;
  description: string;
  icon: string;
  href: string;
  available: boolean;
  color: string;
  requiresAuth: boolean;
  isComingSoon: boolean;
}

/**
 * Get all feature routes configuration
 */
export function getFeatureRoutes(): FeatureRoute[] {
  return [
    {
      title: TEXT_CONSTANTS.FEATURES.SOLDIER_MANAGEMENT.TITLE,
      description: TEXT_CONSTANTS.FEATURES.SOLDIER_MANAGEMENT.DESCRIPTION,
      icon: "✓",
      href: "/status",
      available: true,
      color: "bg-purple-600",
      requiresAuth: true,
      isComingSoon: false
    },
    {
      title: TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.TITLE,
      description: TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.DESCRIPTION,
      icon: "📊",
      href: "/tracking",
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    },
    {
      title: TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.LOGISTICS.DESCRIPTION,
      icon: "📦",
      href: "/logistics",
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    },
    {
      title: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TITLE,
      description: TEXT_CONSTANTS.FEATURES.EQUIPMENT.DESCRIPTION,
      icon: "🔢",
      href: "/equipment", 
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    },
    {
      title: TEXT_CONSTANTS.FEATURES.CONVOYS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.CONVOYS.DESCRIPTION,
      icon: "🚗",
      href: "/convoys",
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    },
    {
      title: TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE,
      description: TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.DESCRIPTION,
      icon: "⏰",
      href: "/guard-scheduler",
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    },
    {
      title: TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.DESCRIPTION,
      icon: "🔧",
      href: "/tools",
      available: false,
      color: "bg-gray-400",
      requiresAuth: true,
      isComingSoon: true
    }
  ];
}

/**
 * Check if a route requires authentication
 */
export function routeRequiresAuth(href: string): boolean {
  const routes = getFeatureRoutes();
  const route = routes.find(r => r.href === href);
  return route?.requiresAuth ?? true; // Default to requiring auth for security
}

/**
 * Check if a route is coming soon
 */
export function routeIsComingSoon(href: string): boolean {
  const routes = getFeatureRoutes();
  const route = routes.find(r => r.href === href);
  return route?.isComingSoon ?? false;
}

/**
 * Check if a route is a management route requiring elevated permissions
 */
export function routeRequiresManagementAccess(href: string): boolean {
  return href === '/management';
}

/**
 * Get menu items for hamburger menu
 */
export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
}

export function getMenuItems(): MenuItem[] {
  const features = getFeatureRoutes();
  
  // Add home page as first item
  const menuItems: MenuItem[] = [
    {
      label: 'עמוד הבית',
      href: '/',
      icon: '🏠'
    }
  ];

  // Add feature routes
  features.forEach(feature => {
    menuItems.push({
      label: feature.title,
      href: feature.href,
      icon: feature.icon
    });
  });

  // Add additional common pages
  menuItems.push(
    {
      label: 'הפרופיל שלי',
      href: '/profile',
      icon: '👤'
    },
    {
      label: 'הגדרות',
      href: '/settings',
      icon: '⚙️'
    }
  );

  return menuItems;
}