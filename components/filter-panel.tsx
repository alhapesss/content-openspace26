'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useContentStore } from '@/lib/store'
import { SEARCH_PRESETS } from '@/lib/search-utils'
import type { SearchFilter } from '@/lib/types'
import { STATUSES, PLATFORMS, FORMATS, PILLARS } from '@/lib/constants'

export function FilterPanel() {
  const { currentFilter, setCurrentFilter, team } = useContentStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof SearchFilter, value: SearchFilter[keyof SearchFilter]) => {
    setCurrentFilter({
      ...currentFilter,
      [key]: value,
    })
  }

  const handleAddStatus = (status: string) => {
    const newStatuses = currentFilter.statuses.includes(status)
      ? currentFilter.statuses.filter((s) => s !== status)
      : [...currentFilter.statuses, status]
    handleFilterChange('statuses', newStatuses)
  }

  const handleAddPlatform = (platform: string) => {
    const newPlatforms = currentFilter.platforms.includes(platform)
      ? currentFilter.platforms.filter((p) => p !== platform)
      : [...currentFilter.platforms, platform]
    handleFilterChange('platforms', newPlatforms)
  }

  const handleAddFormat = (format: string) => {
    const newFormats = currentFilter.formats.includes(format)
      ? currentFilter.formats.filter((f) => f !== format)
      : [...currentFilter.formats, format]
    handleFilterChange('formats', newFormats)
  }

  const handleAddPillar = (pillar: string) => {
    const newPillars = currentFilter.pillars.includes(pillar)
      ? currentFilter.pillars.filter((p) => p !== pillar)
      : [...currentFilter.pillars, pillar]
    handleFilterChange('pillars', newPillars)
  }

  const handleAddTeam = (member: string) => {
    const newTeam = currentFilter.team.includes(member)
      ? currentFilter.team.filter((t) => t !== member)
      : [...currentFilter.team, member]
    handleFilterChange('team', newTeam)
  }

  const handleClearAll = () => {
    setCurrentFilter({
      query: currentFilter.query,
      statuses: [],
      platforms: [],
      formats: [],
      pillars: [],
      team: [],
    })
  }

  const activeFilterCount =
    currentFilter.statuses.length +
    currentFilter.platforms.length +
    currentFilter.formats.length +
    currentFilter.pillars.length +
    currentFilter.team.length

  return (
    <div className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? '▼' : '▶'} Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="px-6 py-4 space-y-4 border-t border-border">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleAddStatus(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentFilter.statuses.includes(status)
                      ? 'bg-[#c1ff1a] text-[#0a0a0a]'
                      : 'bg-muted text-muted-foreground border border-transparent hover:border-foreground/30'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => handleAddPlatform(platform)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentFilter.platforms.includes(platform)
                      ? 'bg-[#c1ff1a] text-[#0a0a0a]'
                      : 'bg-muted text-muted-foreground border border-transparent hover:border-foreground/30'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Format Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">Format</label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => handleAddFormat(format)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentFilter.formats.includes(format)
                      ? 'bg-[#c1ff1a] text-[#0a0a0a]'
                      : 'bg-muted text-muted-foreground border border-transparent hover:border-foreground/30'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Pillar Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">Pillar</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar}
                  onClick={() => handleAddPillar(pillar)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentFilter.pillars.includes(pillar)
                      ? 'bg-[#c1ff1a] text-[#0a0a0a]'
                      : 'bg-muted text-muted-foreground border border-transparent hover:border-foreground/30'
                  }`}
                >
                  {pillar}
                </button>
              ))}
            </div>
          </div>

          {/* Team Filter */}
          {team.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Team</label>
              <div className="flex flex-wrap gap-2">
                {team.map((member) => (
                  <button
                    key={member.name}
                    onClick={() => handleAddTeam(member.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      currentFilter.team.includes(member.name)
                        ? 'bg-[#c1ff1a] text-[#0a0a0a]'
                        : 'bg-muted text-muted-foreground border border-transparent hover:border-foreground/30'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground block mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              {SEARCH_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentFilter(preset.filter)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
