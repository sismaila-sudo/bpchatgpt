/**
 * Skeleton Loaders - États de chargement élégants
 * 
 * Remplace les "Chargement..." par des animations de squelette
 * pour une UX plus moderne et professionnelle
 */

import React from 'react'

// Base skeleton avec animation shimmer
const SkeletonBase = ({ className = '', height = 'h-4' }: { className?: string; height?: string }) => (
  <div className={`${height} ${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse`} />
)

// Skeleton pour carte de projet
export const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <SkeletonBase height="h-6" className="w-3/4" />
        <SkeletonBase height="h-4" className="w-1/2" />
      </div>
      <SkeletonBase height="h-10" className="w-20" />
    </div>
    <div className="space-y-2">
      <SkeletonBase height="h-3" className="w-full" />
      <SkeletonBase height="h-3" className="w-5/6" />
    </div>
    <div className="flex gap-2">
      <SkeletonBase height="h-8" className="w-24" />
      <SkeletonBase height="h-8" className="w-24" />
      <SkeletonBase height="h-8" className="w-24" />
    </div>
  </div>
)

// Skeleton pour tableau
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} height="h-4" className="flex-1" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBase key={j} height="h-4" className="flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Skeleton pour formulaire
export const FormSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
    <SkeletonBase height="h-8" className="w-1/3" />
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase height="h-4" className="w-1/4" />
          <SkeletonBase height="h-12" className="w-full" />
        </div>
      ))}
    </div>
    <div className="flex gap-3">
      <SkeletonBase height="h-12" className="w-32" />
      <SkeletonBase height="h-12" className="w-32" />
    </div>
  </div>
)

// Skeleton pour widget de statistiques
export const StatWidgetSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
    <div className="flex items-center gap-3">
      <SkeletonBase height="h-12" className="w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBase height="h-4" className="w-1/2" />
        <SkeletonBase height="h-6" className="w-1/3" />
      </div>
    </div>
    <SkeletonBase height="h-2" className="w-full rounded-full" />
  </div>
)

// Skeleton pour score FONGIP
export const FONGIPScoreSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
    <div className="flex items-center gap-3">
      <SkeletonBase height="h-12" className="w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBase height="h-6" className="w-1/2" />
        <SkeletonBase height="h-4" className="w-1/3" />
      </div>
    </div>
    
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <SkeletonBase height="h-32" className="w-32 rounded-full" />
      <SkeletonBase height="h-6" className="w-24" />
    </div>

    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <SkeletonBase height="h-4" className="w-1/3" />
          <SkeletonBase height="h-4" className="w-16" />
        </div>
      ))}
    </div>
  </div>
)

// Skeleton pour liste de documents
export const DocumentListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
        <SkeletonBase height="h-12" className="w-12 rounded" />
        <div className="flex-1 space-y-2">
          <SkeletonBase height="h-4" className="w-2/3" />
          <SkeletonBase height="h-3" className="w-1/3" />
        </div>
        <SkeletonBase height="h-8" className="w-20" />
      </div>
    ))}
  </div>
)

// Skeleton pour grille (dashboard)
export const DashboardGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <StatWidgetSkeleton key={i} />
    ))}
  </div>
)

// Skeleton pour éditeur de texte
export const EditorSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    {/* Toolbar */}
    <div className="border-b border-gray-200 p-3 flex gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBase key={i} height="h-8" className="w-8" />
      ))}
    </div>
    {/* Content */}
    <div className="p-6 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBase key={i} height="h-4" className={i % 3 === 0 ? "w-5/6" : "w-full"} />
      ))}
    </div>
  </div>
)

// Skeleton pour graphique
export const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="space-y-4">
      <SkeletonBase height="h-6" className="w-1/3" />
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBase 
            key={i} 
            height={`h-${Math.floor(Math.random() * 40) + 20}`} 
            className="flex-1"
          />
        ))}
      </div>
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBase height="h-3" className="w-3" />
            <SkeletonBase height="h-3" className="w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Skeleton pour page complète
export const PageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-6">
    {/* Header */}
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SkeletonBase height="h-8" className="w-1/4 mb-4" />
      <SkeletonBase height="h-4" className="w-1/2" />
    </div>
    
    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <FormSkeleton />
        <TableSkeleton />
      </div>
      <div className="space-y-6">
        <StatWidgetSkeleton />
        <FONGIPScoreSkeleton />
      </div>
    </div>
  </div>
)

// Export default pour utilisation simple
export default {
  ProjectCard: ProjectCardSkeleton,
  Table: TableSkeleton,
  Form: FormSkeleton,
  StatWidget: StatWidgetSkeleton,
  FONGIPScore: FONGIPScoreSkeleton,
  DocumentList: DocumentListSkeleton,
  DashboardGrid: DashboardGridSkeleton,
  Editor: EditorSkeleton,
  Chart: ChartSkeleton,
  Page: PageSkeleton
}

