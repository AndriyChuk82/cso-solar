# Solar Wizard Implementation

## Overview
Implemented a React-based Solar Station Wizard component that replicates the logic from `public/app.js` (lines 2920-3364).

## Component Location
`proposals/src/components/SolarWizard.tsx`

## Features Implemented

### 1. Station Configuration
- **Power Input**: User specifies station power in kW
- **Station Type**: On-Grid or Hybrid selection
- **Backup Capacity**: For hybrid systems, specify battery backup in kWh
- **Panel Reserve**: Percentage reserve for panel calculation (default 20%)
- **Mounting Type**: Roof or ground mounting selection

### 2. Smart Equipment Selection

#### Inverters
- Auto-recommends based on station type:
  - On-Grid: Prefers Huawei inverters
  - Hybrid: Prefers Deye inverters
- Finds closest power match with penalty for undersized units
- Sorts by recommendation and subcategory preference

#### Solar Panels
- Auto-recommends Longi 615W/620W panels
- Calculates quantity based on power + reserve percentage
- Converts panel wattage to kW automatically

#### Batteries (Hybrid Only)
- **HV/LV Detection**: Automatically detects if inverter is High Voltage or Low Voltage
  - HV if name contains "hv" or power ≥ 30kW
  - LV if name contains "lv" or power < 30kW
- **Smart Filtering**: Shows only compatible batteries
  - HV inverters → HV batteries (BOS, GB series)
  - LV inverters → LV batteries (M6.1, G5.1 series)
- **BMS Auto-Addition**: Adds matching BMS for HV batteries
- **Rack Calculation**: Adds battery racks for 2+ batteries
  - 2-8 batteries: 8-slot rack
  - 9-12 batteries: 12-slot rack
  - 12+: Multiple 12-slot racks

### 3. Automatic Item Generation

The wizard generates a complete proposal with:

1. **Inverter** (1 unit)
2. **Solar Panels** (calculated quantity)
3. **Batteries** (if hybrid with backup)
4. **BMS** (if HV batteries)
5. **Battery Rack** (if 2+ batteries)
6. **Mounting System**:
   - Ground: Custom metal structure (45.2 USD per panel)
   - Roof: Mounting kit from catalog or custom (15 USD per panel)
7. **Solar Cable**: DC cable 4-6mm² (3m per panel)
8. **Protection Kit**: AC/DC protection, breakers, connectors (scaled by power)
9. **Installation Service**: Labor cost (100 USD per kW, no markup)

### 4. Pricing Logic
- Uses proposal markup setting (default 15%)
- Applies markup to all items except installation
- Converts product prices to USD if needed
- Rounds prices to 1 decimal place

### 5. UI/UX Features
- **Professional Design**: Gradient header, organized sections
- **Real-time Updates**: Equipment list updates as parameters change
- **Visual Indicators**: ✅ marks recommended items
- **Validation**: Warns if panels are insufficient for inverter power
- **Responsive Layout**: Works on desktop and mobile
- **Modal Interface**: Non-intrusive overlay design

## Integration

### Button Location
Added to `ProposalBuilderTable.tsx` in the actions bar:
- Purple gradient button with ⚡ icon
- Label: "✨ Автопідбір СЕС"
- Always visible (not dependent on items in proposal)

### Data Flow
1. Reads products from `useProposalStore`
2. Filters and sorts based on wizard logic
3. Creates proposal items with proper structure
4. Adds items via `addToProposal` hook
5. Closes modal and shows success message

## Technical Details

### Power Parsing
Uses regex to extract power from product names:
- Matches: "30KTL", "30kW", "30 кВт", "30K"
- Filters out false matches (e.g., "SUN2000" → ignores 2000)
- Returns null for invalid/missing power specs

### Product Matching
- **findClosestProduct**: Finds product by category, keywords, and power
- Penalty system: +500 to diff if product power < target power
- Ensures inverters are sized appropriately (prefer oversized)

### Custom Items
Creates custom items when catalog products not found:
- Ground mounting structure
- Roof mounting kit
- Solar cable
- Protection kit
- Installation service

## Testing Checklist
- ✅ Build succeeds without errors
- ✅ TypeScript types are correct
- ✅ Component integrates with existing store
- ✅ Modal opens/closes properly
- ✅ HV/LV battery logic works
- ✅ All items are added to proposal
- ✅ Markup is applied correctly
- ✅ UI matches project design system

## Future Enhancements
- Save wizard configurations as templates
- Export wizard settings
- Add more mounting types (carport, tracker)
- Support for multiple inverter configurations
- Advanced battery configuration (parallel/series)
