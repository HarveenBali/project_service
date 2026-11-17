import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import Tooltip from '@mui/joy/Tooltip';
import Typography from '@mui/joy/Typography';
import type { Health } from './health';

const COLOR = { healthy: 'success', at_risk: 'warning', critical: 'danger' } as const;
const LABEL = { healthy: 'Healthy', at_risk: 'At risk', critical: 'Critical' } as const;

export function HealthBadge({ health }: { health: Health }) {
  return (
    <Tooltip
      variant="outlined"
      arrow
      title={
        <Box sx={{ p: 0.5, maxWidth: 260 }}>
          <Typography level="title-sm">Health score {health.score}/100</Typography>
          {health.factors.map((f) => (
            <Typography key={f.label} level="body-xs">
              {f.label}: −{f.penalty}/{f.max} · {f.detail}
            </Typography>
          ))}
        </Box>
      }
    >
      <Chip size="sm" variant="soft" color={COLOR[health.level]} tabIndex={0} aria-label={`Project health ${LABEL[health.level]}, score ${health.score}`}>
        {LABEL[health.level]} · {health.score}
      </Chip>
    </Tooltip>
  );
}
