'use client'
import { Checkbox, CheckboxGroup } from '@weichenlin/swell-ui'

export default function CheckboxGroupExample() {
  return (
    <CheckboxGroup
      legend="Sync options"
      description="Applied the next time you sync."
      className="w-full max-w-sm"
    >
      <Checkbox
        name="syncOptions"
        value="prune"
        label="Prune"
        description="Deletes resources that are no longer in Git"
      />
      <Checkbox
        name="syncOptions"
        value="dryRun"
        label="Dry run"
        description="Shows what would change without applying it"
      />
      <Checkbox name="syncOptions" value="force" label="Force" />
    </CheckboxGroup>
  )
}
