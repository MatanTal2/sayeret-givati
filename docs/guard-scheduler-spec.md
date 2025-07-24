# ⏰ מחולל שמירות - Guard Schedule Generator Specification

## 📋 Overview

The Guard Schedule Generator (מחולל שמירות) is an automated system for creating guard duty rosters with intelligent scheduling based on time intervals, personnel constraints, and military requirements.

## 🎯 Core Objectives

- **Automate** guard duty scheduling to reduce manual work
- **Optimize** personnel allocation based on constraints and preferences  
- **Ensure** fair distribution of guard duties across all personnel
- **Generate** professional, printable schedules in Hebrew/English
- **Integrate** with existing personnel management system

## 🚀 Key Features

### 1. **Time Management**

- **Shift Duration Configuration**: 2h, 4h, 6h, 8h intervals
- **Custom Time Slots**: Define start/end times for shifts
- **Break Management**: Automatic break intervals between shifts
- **Weekend/Holiday Handling**: Special scheduling for non-working days
- **Multi-day Scheduling**: Generate weekly/monthly rosters

### 2. **Personnel Constraints**

- **Rank Requirements**: Minimum rank for specific shifts
- **Blackout Times**: Personal unavailability (אסור שמירה)
- **Preferred Slots**: Personnel time preferences
- **Maximum Load**: Limit shifts per person per week
- **Rest Periods**: Mandatory rest between consecutive shifts
- **Priority Personnel**: Assign priority levels for critical shifts

### 3. **Intelligent Scheduling Algorithm**

- **Conflict Detection**: Identify and resolve scheduling conflicts
- **Load Balancing**: Even distribution of guard duties
- **Constraint Satisfaction**: Respect all personnel rules
- **Optimization**: Minimize personnel fatigue and maximize coverage
- **Fallback Options**: Alternative personnel for emergencies

### 4. **Output Formats**

- **Text Format**: WhatsApp/SMS ready text
- **Table View**: Excel-compatible tables
- **Calendar Integration**: Import to Google Calendar/Outlook
- **Print Layout**: Professional printable PDF
- **Hebrew/English**: Bilingual support

## 📊 Data Models

### GuardShift

```typescript
interface GuardShift {
  id: string;
  date: Date;
  startTime: string;      // "06:00"
  endTime: string;        // "14:00"
  duration: number;       // hours
  assignedPersonnel: string[]; // user IDs
  location: string;       // guard post location
  requirements: {
    minRank: string;
    maxPersonnel: number;
    specialSkills?: string[];
  };
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}
```

### PersonnelConstraint

```typescript
interface PersonnelConstraint {
  personnelId: string;
  constraints: {
    blackoutTimes: TimeSlot[];     // Cannot guard
    preferredTimes: TimeSlot[];    // Prefers to guard
    maxShiftsPerWeek: number;
    minRestHours: number;          // Between shifts
    availableDays: string[];       // Days of week
  };
  priority: 'low' | 'normal' | 'high';
  specialSkills: string[];
}
```

### ScheduleConfig

```typescript
interface ScheduleConfig {
  timeSlots: TimeSlot[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  shiftDuration: number;
  minPersonnelPerShift: number;
  algorithm: 'round_robin' | 'optimized' | 'priority_based';
  preferences: {
    avoidConsecutiveShifts: boolean;
    balanceWorkload: boolean;
    respectPreferences: boolean;
  };
}
```

## 🔧 Technical Implementation

### Phase 1: Core Engine

1. **Basic Scheduling Algorithm**
   - Round-robin assignment
   - Simple constraint checking
   - Time slot management

2. **Data Storage**
   - Firestore collections for shifts and constraints
   - Personnel integration with existing system

3. **Basic UI**
   - Simple configuration form
   - Text output generation

### Phase 2: Advanced Features

1. **Optimization Algorithm**
   - Constraint satisfaction solver
   - Load balancing optimization
   - Conflict resolution logic

2. **Enhanced UI**
   - Visual schedule calendar
   - Drag-and-drop editing
   - Real-time conflict detection

3. **Export Options**
   - Multiple output formats
   - Template customization
   - Print optimization

### Phase 3: Integration & Analytics

1. **Mobile Integration**
   - SMS notifications
   - Mobile app support
   - Push notifications

2. **Analytics Dashboard**
   - Guard duty statistics
   - Personnel workload analysis
   - Historical reporting

3. **Advanced Features**
   - AI-powered optimization
   - Predictive scheduling
   - Integration with external systems

## 🎨 User Interface Design

### Configuration Screen

```ascii
┌─────────────────────────────────────────┐
│ ⏰ מחולל שמירות - Configuration          │
├─────────────────────────────────────────┤
│ 📅 Date Range: [Start] [End]            │
│ 🕐 Shift Duration: [Dropdown]           │
│ 👥 Personnel: [Multi-select]            │
│ 📋 Constraints: [Configure Rules]       │
│ ⚙️ Algorithm: [Options]                 │
│                                         │
│ [Preview Schedule] [Generate] [Export]  │
└─────────────────────────────────────────┘
```

### Schedule Output

```ascii
🛡️ לוח שמירות - שבוע 15/01/2025

📅 יום א' 15/01
🕐 06:00-14:00 - רס"ל מתן טל
🕐 14:00-22:00 - סמל אברהם כהן  
🕐 22:00-06:00 - רב"ט דוד לוי

📅 יום ב' 16/01
🕐 06:00-14:00 - סג"מ יוסי ברק
🕐 14:00-22:00 - רס"ל מתן טל
🕐 22:00-06:00 - סמל אברהם כהן

...
```

## 🔒 Security & Permissions

### Access Control

- **Admin Only**: Schedule creation and modification
- **View Access**: Personnel can view their assigned shifts
- **Export Control**: Restrict sensitive information in exports

### Data Protection

- **Audit Trail**: Log all schedule changes
- **Backup System**: Automatic schedule backups
- **Encryption**: Secure data transmission and storage

## 📈 Success Metrics

### Efficiency Metrics

- **Time Saved**: Reduction in manual scheduling time
- **Error Rate**: Conflicts and mistakes in schedules
- **Coverage**: Percentage of shifts properly filled

### User Satisfaction

- **Adoption Rate**: Personnel using the system
- **Feedback Score**: User satisfaction ratings
- **Conflict Resolution**: Time to resolve scheduling issues

## 🛠️ Development Phases

### Phase 1: MVP (2-3 weeks)

- [ ] Basic time slot configuration
- [ ] Simple round-robin assignment algorithm
- [ ] Text output generation
- [ ] Personnel constraint basics
- [ ] Admin interface integration

### Phase 2: Enhanced (3-4 weeks)

- [ ] Advanced constraint system
- [ ] Visual schedule interface
- [ ] Multiple output formats
- [ ] Conflict detection and resolution
- [ ] Personnel preference management

### Phase 3: Advanced (4-6 weeks)

- [ ] Optimization algorithms
- [ ] Mobile notifications
- [ ] Analytics and reporting
- [ ] Calendar integration
- [ ] Historical data analysis

## 🧪 Testing Strategy

### Unit Tests

- Scheduling algorithm correctness
- Constraint validation logic
- Output format generation

### Integration Tests

- Personnel system integration
- Database operations
- Export functionality

### User Acceptance Tests

- Schedule generation scenarios
- Conflict resolution workflows
- Export and sharing processes

## 📚 Future Enhancements

### AI Integration

- **Machine Learning**: Learn from historical scheduling patterns
- **Predictive Analytics**: Forecast personnel availability
- **Smart Suggestions**: Recommend optimal schedule configurations

### External Integrations

- **Military Systems**: Integration with military personnel databases
- **Communication**: WhatsApp/Telegram bot integration
- **Calendar Systems**: Sync with external calendar applications

### Advanced Features

- **Multi-location**: Support for multiple guard posts
- **Equipment Scheduling**: Coordinate equipment with personnel
- **Training Integration**: Schedule based on training requirements

---

*This specification will be updated as development progresses and requirements evolve.*
