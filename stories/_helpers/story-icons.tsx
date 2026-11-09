import { GitBranch, RefreshCw, Rocket, RotateCcw, Trash2 } from 'lucide-react'

// Storybook select control: option name -> rendered Lucide icon
const iconOptions = ['none', 'GitBranch', 'RefreshCw', 'Rocket', 'RotateCcw', 'Trash2']
const iconMapping = {
  none: undefined,
  GitBranch: <GitBranch />,
  RefreshCw: <RefreshCw />,
  Rocket: <Rocket />,
  RotateCcw: <RotateCcw />,
  Trash2: <Trash2 />,
}
export const iconArgType = {
  control: 'select',
  options: iconOptions,
  mapping: iconMapping,
} as const
