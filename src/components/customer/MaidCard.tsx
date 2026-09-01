'use client';

import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Maid } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface MaidCardProps {
  maid: Maid;
  compact?: boolean;
}

export function MaidCard({ maid, compact = false }: MaidCardProps) {
  const initials = getInitials(maid.name);

  return (
    <Link href={`/maids/${maid.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="maid-card" style={{ padding: compact ? '14px' : '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: compact ? 52 : 64,
              height: compact ? 52 : 64,
              borderRadius: '50%',
              background: maid.profilePhoto ? `url(${maid.profilePhoto}) center/cover` : 'var(--primary-100)',
              backgroundSize: 'cover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: compact ? '18px' : '22px',
              fontWeight: 700,
              color: 'var(--primary-600)',
            }}>
              {!maid.profilePhoto && initials}
            </div>
            {/* Availability dot */}
            <div style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: maid.availability === 'available' ? 'var(--success-500)' : maid.availability === 'busy' ? 'var(--accent-500)' : 'var(--gray-400)',
              border: '2px solid white',
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                {maid.name}
              </span>
              {maid.approvalStatus === 'approved' && maid.verificationStatus === 'verified' && (
                <span className="verified-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  <CheckCircle size={10} />
                  Verified
                </span>
              )}
            </div>

            {/* Services */}
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {maid.services.slice(0, 3).join(' • ')}
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
              <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {maid.area}, {maid.city}
              </span>
            </div>

            {/* Rating + Experience */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              {maid.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={12} style={{ color: 'var(--accent-500)', fill: 'var(--accent-500)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {maid.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ({maid.totalRatings})
                  </span>
                </div>
              )}
              {maid.experience != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {maid.experience} yr{maid.experience !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {maid.hourlyPrice && (
              <div>
                <span className="price-tag-sm">{formatINR(maid.hourlyPrice)}</span>
                <span className="price-unit">/hr</span>
              </div>
            )}
            {!maid.hourlyPrice && maid.dailyPrice && (
              <div>
                <span className="price-tag-sm">{formatINR(maid.dailyPrice)}</span>
                <span className="price-unit">/day</span>
              </div>
            )}
            <div style={{
              marginTop: '6px',
              fontSize: '10px',
              fontWeight: 600,
              color: maid.availability === 'available' ? 'var(--success-600)' : maid.availability === 'busy' ? 'var(--accent-600)' : 'var(--text-muted)',
            }}>
              {maid.availability === 'available' ? '● Available' : maid.availability === 'busy' ? '● Busy' : '● Offline'}
            </div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Service area pills */}
            {maid.serviceAreas.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                {maid.serviceAreas.slice(0, 3).map(area => (
                  <span key={area} style={{
                    background: 'var(--gray-100)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {area}
                  </span>
                ))}
                {maid.serviceAreas.length > 3 && (
                  <span style={{
                    background: 'var(--gray-100)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    +{maid.serviceAreas.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* View profile button */}
            <div
              className="btn btn-secondary btn-sm btn-full"
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              View Profile
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

// Skeleton
export function MaidCardSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 12, width: '50%' }} />
        </div>
        <div style={{ width: 60 }}>
          <div className="skeleton" style={{ height: 20, marginBottom: '6px' }} />
          <div className="skeleton" style={{ height: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 36, marginTop: '12px' }} />
    </div>
  );
}
