import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_COLORS = {
  Ontbijt: '#f59e0b',
  Lunch: '#10b981',
  Diner: '#6366f1',
  Snack: '#ec4899',
  Dessert: '#f97316',
  Drank: '#06b6d4',
  Overig: '#8b5cf6',
};

export default function RecipeCard({ recipe, onClick, onEdit, onDelete }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const isOwner = user && (user.id === recipe.user_id || user.role === 'admin');
  const categoryColor = CATEGORY_COLORS[recipe.category] || theme.primary;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div
      onClick={() => onClick(recipe)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.surface,
        borderRadius: 14,
        border: `1px solid ${theme.border}`,
        boxShadow: hovered ? theme.shadowLg : theme.shadow,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Color header strip */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${categoryColor}, ${theme.primary})` }} />

      <div style={{ padding: '16px 16px 12px' }}>
        {/* Category + Public badge */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {recipe.category && (
            <span style={{
              background: `${categoryColor}20`,
              color: categoryColor,
              border: `1px solid ${categoryColor}40`,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {recipe.category}
            </span>
          )}
          {recipe.is_public ? (
            <span style={{
              background: `${theme.success}20`,
              color: theme.success,
              border: `1px solid ${theme.success}40`,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
            }}>
              Openbaar
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: theme.text,
          marginBottom: 6,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p style={{
            fontSize: 13,
            color: theme.textSecondary,
            lineHeight: 1.5,
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {recipe.description}
          </p>
        )}

        {/* Meta info */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          {totalTime > 0 && (
            <span style={{ fontSize: 12, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
              ⏱ {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span style={{ fontSize: 12, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
              👥 {recipe.servings} pers.
            </span>
          )}
          <span style={{ fontSize: 12, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
            👤 {recipe.author}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                background: theme.bg,
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 11,
              }}>
                #{tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span style={{ fontSize: 11, color: theme.textSecondary, padding: '2px 4px' }}>
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            gap: 8,
            marginTop: 'auto',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(recipe)}
            style={{
              flex: 1,
              padding: '7px',
              background: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              color: theme.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Bewerken
          </button>
          <button
            onClick={() => onDelete(recipe)}
            style={{
              flex: 1,
              padding: '7px',
              background: `${theme.danger}15`,
              border: `1px solid ${theme.danger}40`,
              borderRadius: 8,
              color: theme.danger,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Verwijderen
          </button>
        </div>
      )}
    </div>
  );
}
