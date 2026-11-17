import type { ComponentType } from 'react'
import AccordionDemo from './accordion-demo'
import AlertActionDismiss from './alert-action-dismiss'
import AlertDemo from './alert-demo'
import AlertTones from './alert-tones'
import BadgeBusy from './badge-busy'
import BadgeDemo from './badge-demo'
import BadgeSizes from './badge-sizes'
import BadgeTones from './badge-tones'
import BadgeVariants from './badge-variants'
import ButtonDemo from './button-demo'
import ButtonIntents from './button-intents'
import CardAction from './card-action'
import CardDemo from './card-demo'
import CardFullBleed from './card-full-bleed'
import CheckboxDemo from './checkbox-demo'
import CheckboxGroupExample from './checkbox-group'
import CheckboxGroupHorizontal from './checkbox-group-horizontal'
import CheckboxIndeterminate from './checkbox-indeterminate'
import CheckboxStates from './checkbox-states'
import ComboboxAsync from './combobox-async'
import ComboboxControlled from './combobox-controlled'
import ComboboxDemo from './combobox-demo'
import ComboboxGroups from './combobox-groups'
import DialogAlert from './dialog-alert'
import DialogDemo from './dialog-demo'
import DialogSizes from './dialog-sizes'
import DrawerDemo from './drawer-demo'
import DrawerLeft from './drawer-left'
import DrawerSizes from './drawer-sizes'
import DropdownMenuControlled from './dropdown-menu-controlled'
import DropdownMenuDemo from './dropdown-menu-demo'
import DropdownMenuGroups from './dropdown-menu-groups'
import DropdownMenuPosition from './dropdown-menu-position'
import InputCopy from './input-copy'
import InputDemo from './input-demo'
import InputFloating from './input-floating'
import InputPassword from './input-password'
import InputSearch from './input-search'
import InputSizes from './input-sizes'
import InputStates from './input-states'
import MeterDemo from './meter-demo'
import MeterEmpty from './meter-empty'
import MeterMixed from './meter-mixed'
import MeterSliver from './meter-sliver'
import RadioGroupCard from './radio-group-card'
import RadioGroupControlled from './radio-group-controlled'
import RadioGroupDemo from './radio-group-demo'
import RadioGroupStates from './radio-group-states'
import RangeSliderDemo from './range-slider-demo'
import SelectControlled from './select-controlled'
import SelectDemo from './select-demo'
import SelectGroups from './select-groups'
import SelectIcons from './select-icons'
import SelectStates from './select-states'
import SidebarDemo from './sidebar-demo'
import SliderControlled from './slider-controlled'
import SliderDemo from './slider-demo'
import SliderMarks from './slider-marks'
import SliderStates from './slider-states'
import SwitchControlled from './switch-controlled'
import SwitchDemo from './switch-demo'
import SwitchLabelPosition from './switch-label-position'
import SwitchLoading from './switch-loading'
import SwitchSizes from './switch-sizes'
import TabNavDemo from './tab-nav-demo'
import TableDemo from './table-demo'
import TablePagination from './table-pagination'
import TableSearch from './table-search'
import TableSelection from './table-selection'
import TableSorting from './table-sorting'
import TabsDemo from './tabs-demo'
import TabsIconsBadges from './tabs-icons-badges'
import TabsSegmented from './tabs-segmented'
import TextareaAutoResize from './textarea-auto-resize'
import TextareaCount from './textarea-count'
import TextareaDemo from './textarea-demo'
import TextareaStates from './textarea-states'
import ThemeSwitcherDemo from './theme-switcher-demo'
import ToastAction from './toast-action'
import ToastDemo from './toast-demo'
import ToastPromise from './toast-promise'
import ToastTypes from './toast-types'
import TooltipBadge from './tooltip-badge'
import TooltipDemo from './tooltip-demo'
import TooltipDisabled from './tooltip-disabled'
import TooltipSides from './tooltip-sides'

/** Demo name -> component. The file examples/<name>.tsx is also shown as the preview's source. */
export const examples = {
  'accordion-demo': AccordionDemo,
  'alert-action-dismiss': AlertActionDismiss,
  'alert-demo': AlertDemo,
  'alert-tones': AlertTones,
  'badge-busy': BadgeBusy,
  'badge-demo': BadgeDemo,
  'badge-sizes': BadgeSizes,
  'badge-tones': BadgeTones,
  'badge-variants': BadgeVariants,
  'button-demo': ButtonDemo,
  'button-intents': ButtonIntents,
  'card-action': CardAction,
  'card-demo': CardDemo,
  'card-full-bleed': CardFullBleed,
  'checkbox-demo': CheckboxDemo,
  'checkbox-group': CheckboxGroupExample,
  'checkbox-group-horizontal': CheckboxGroupHorizontal,
  'checkbox-indeterminate': CheckboxIndeterminate,
  'checkbox-states': CheckboxStates,
  'combobox-async': ComboboxAsync,
  'combobox-controlled': ComboboxControlled,
  'combobox-demo': ComboboxDemo,
  'combobox-groups': ComboboxGroups,
  'dialog-alert': DialogAlert,
  'dialog-demo': DialogDemo,
  'dialog-sizes': DialogSizes,
  'drawer-demo': DrawerDemo,
  'drawer-left': DrawerLeft,
  'drawer-sizes': DrawerSizes,
  'dropdown-menu-controlled': DropdownMenuControlled,
  'dropdown-menu-demo': DropdownMenuDemo,
  'dropdown-menu-groups': DropdownMenuGroups,
  'dropdown-menu-position': DropdownMenuPosition,
  'input-copy': InputCopy,
  'input-demo': InputDemo,
  'input-floating': InputFloating,
  'input-password': InputPassword,
  'input-search': InputSearch,
  'input-sizes': InputSizes,
  'input-states': InputStates,
  'meter-demo': MeterDemo,
  'meter-empty': MeterEmpty,
  'meter-mixed': MeterMixed,
  'meter-sliver': MeterSliver,
  'radio-group-card': RadioGroupCard,
  'radio-group-controlled': RadioGroupControlled,
  'radio-group-demo': RadioGroupDemo,
  'radio-group-states': RadioGroupStates,
  'range-slider-demo': RangeSliderDemo,
  'select-controlled': SelectControlled,
  'select-demo': SelectDemo,
  'select-groups': SelectGroups,
  'select-icons': SelectIcons,
  'select-states': SelectStates,
  'sidebar-demo': SidebarDemo,
  'slider-controlled': SliderControlled,
  'slider-demo': SliderDemo,
  'slider-marks': SliderMarks,
  'slider-states': SliderStates,
  'switch-controlled': SwitchControlled,
  'switch-demo': SwitchDemo,
  'switch-label-position': SwitchLabelPosition,
  'switch-loading': SwitchLoading,
  'switch-sizes': SwitchSizes,
  'tab-nav-demo': TabNavDemo,
  'table-demo': TableDemo,
  'table-pagination': TablePagination,
  'table-search': TableSearch,
  'table-selection': TableSelection,
  'table-sorting': TableSorting,
  'tabs-demo': TabsDemo,
  'tabs-icons-badges': TabsIconsBadges,
  'tabs-segmented': TabsSegmented,
  'textarea-auto-resize': TextareaAutoResize,
  'textarea-count': TextareaCount,
  'textarea-demo': TextareaDemo,
  'textarea-states': TextareaStates,
  'theme-switcher-demo': ThemeSwitcherDemo,
  'toast-action': ToastAction,
  'toast-demo': ToastDemo,
  'toast-promise': ToastPromise,
  'toast-types': ToastTypes,
  'tooltip-badge': TooltipBadge,
  'tooltip-demo': TooltipDemo,
  'tooltip-disabled': TooltipDisabled,
  'tooltip-sides': TooltipSides,
} satisfies Record<string, ComponentType>

export type ExampleName = keyof typeof examples
