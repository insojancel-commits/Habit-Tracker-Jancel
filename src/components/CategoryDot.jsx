const CAT_COLORS = {
  business: 'var(--cat-business)',
  content: 'var(--cat-content)',
  health: 'var(--cat-health)',
  personal: 'var(--cat-personal)'
}

const CAT_LABELS = {
  business: 'Business',
  content: 'Content',
  health: 'Health',
  personal: 'Personal'
}

export function categoryColor(cat) {
  return CAT_COLORS[cat] || CAT_COLORS.personal
}

export function categoryLabel(cat) {
  return CAT_LABELS[cat] || 'Personal'
}

export default function CategoryDot({ category, size = 7 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: categoryColor(category),
        flexShrink: 0,
        display: 'inline-block'
      }}
    />
  )
}
