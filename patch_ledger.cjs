const fs = require('fs');
let code = fs.readFileSync('src/components/airtel/AirtelMoneyLedger.tsx', 'utf-8');

// 1. Add Trash2 and Edit3 to imports
code = code.replace(
  "ShieldCheck,",
  "ShieldCheck,\n  Trash2,\n  Edit3,"
);

// 2. Destructure new context methods and role
code = code.replace(
  "verifyAirtelMoneyRecord,\n  } = useApp();",
  "verifyAirtelMoneyRecord,\n    deleteAirtelMoneyRecord,\n    updateAirtelMoneyRecord,\n    role,\n  } = useApp();"
);

// 3. Add states for Editing and Deleting
code = code.replace(
  "const [isAddingRecord, setIsAddingRecord] = useState(false);",
  "const [isAddingRecord, setIsAddingRecord] = useState(false);\n  const [recordToEdit, setRecordToEdit] = useState<AirtelMoneyRecord | null>(null);\n  const [recordToDelete, setRecordToDelete] = useState<AirtelMoneyRecord | null>(null);"
);

fs.writeFileSync('src/components/airtel/AirtelMoneyLedger.tsx', code);
