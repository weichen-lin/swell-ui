'use client'
import {
  Checkbox,
  CheckboxGroup,
  CheckboxGroupLabel,
  CheckboxGroupDescription,
  CheckboxGroupItems,
} from '@weichenlin/swell-ui'

export default function CheckboxGroupExample() {
  return (
    <CheckboxGroup className="w-full max-w-sm">
      <CheckboxGroupLabel>Sync options</CheckboxGroupLabel>
      <CheckboxGroupDescription>Applied the next time you sync.</CheckboxGroupDescription>
      <CheckboxGroupItems>
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
      </CheckboxGroupItems>
    </CheckboxGroup>
  )
}
