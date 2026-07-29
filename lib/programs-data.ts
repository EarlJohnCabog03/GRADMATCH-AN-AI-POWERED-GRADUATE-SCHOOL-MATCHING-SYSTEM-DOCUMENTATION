export type Program = {
  id: string;
  school: string;
  program: string;
  degree: "MS" | "PhD" | "MEng" | "MBA" | "MA";
  field: string;
  country: string;
  city: string;
  deadline: string; // ISO
  greRequired: boolean;
  funding: "Full" | "Partial" | "None" | "Varies";
  notes: string;
  keywords: string[];
};

export const PROGRAMS: Program[] = [
  { id: "mit-eecs-phd", school: "MIT", program: "EECS", degree: "PhD", field: "Computer Science", country: "USA", city: "Cambridge, MA", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Top ML, systems, theory.", keywords: ["machine learning","systems","theory"] },
  { id: "stanford-cs-phd", school: "Stanford", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Stanford, CA", deadline: "2026-12-08", greRequired: false, funding: "Full", notes: "HCI, NLP, AI strong.", keywords: ["nlp","hci","ai"] },
  { id: "cmu-mscv", school: "CMU", program: "MS in Computer Vision", degree: "MS", field: "Computer Vision", country: "USA", city: "Pittsburgh, PA", deadline: "2026-12-09", greRequired: false, funding: "Partial", notes: "Robotics Institute.", keywords: ["computer vision","robotics"] },
  { id: "berkeley-eecs-phd", school: "UC Berkeley", program: "EECS", degree: "PhD", field: "Computer Science", country: "USA", city: "Berkeley, CA", deadline: "2026-12-08", greRequired: false, funding: "Full", notes: "BAIR, RISELab.", keywords: ["ai","systems"] },
  { id: "uw-cs-phd", school: "University of Washington", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Seattle, WA", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "NLP, ML, theory.", keywords: ["nlp","ml"] },
  { id: "princeton-cs-phd", school: "Princeton", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Princeton, NJ", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Theory & ML.", keywords: ["theory","ml"] },
  { id: "harvard-seas-phd", school: "Harvard", program: "SEAS — Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Cambridge, MA", deadline: "2026-12-01", greRequired: false, funding: "Full", notes: "Applied math, AI.", keywords: ["ai","applied math"] },
  { id: "columbia-cs-ms", school: "Columbia", program: "MS in Computer Science", degree: "MS", field: "Computer Science", country: "USA", city: "New York, NY", deadline: "2027-02-15", greRequired: false, funding: "None", notes: "NYC location, flexible tracks.", keywords: ["ml","systems","theory"] },
  { id: "nyu-cs-phd", school: "NYU", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "New York, NY", deadline: "2026-12-12", greRequired: false, funding: "Full", notes: "CILVR ML lab.", keywords: ["ml","nlp"] },
  { id: "georgia-tech-cs", school: "Georgia Tech", program: "MS in Computer Science", degree: "MS", field: "Computer Science", country: "USA", city: "Atlanta, GA", deadline: "2027-01-15", greRequired: false, funding: "Partial", notes: "OMSCS option available.", keywords: ["ml","systems"] },
  { id: "uiuc-cs-phd", school: "UIUC", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Urbana, IL", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Systems, DB, AI.", keywords: ["systems","ai","db"] },
  { id: "umich-cs-phd", school: "University of Michigan", program: "CSE", degree: "PhD", field: "Computer Science", country: "USA", city: "Ann Arbor, MI", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Strong AI & HCI.", keywords: ["ai","hci"] },
  { id: "utaustin-cs", school: "UT Austin", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Austin, TX", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Robot Learning, NLP.", keywords: ["nlp","robotics"] },
  { id: "ucla-cs-ms", school: "UCLA", program: "MS in Computer Science", degree: "MS", field: "Computer Science", country: "USA", city: "Los Angeles, CA", deadline: "2026-12-01", greRequired: false, funding: "Partial", notes: "AI, vision, NLP.", keywords: ["ai","vision"] },
  { id: "ucsd-cs-phd", school: "UC San Diego", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "La Jolla, CA", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "ML, HCI, systems.", keywords: ["ml","hci"] },
  { id: "yale-cs-phd", school: "Yale", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "New Haven, CT", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Theory, NLP.", keywords: ["theory","nlp"] },
  { id: "duke-cs-phd", school: "Duke", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Durham, NC", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "ML, fairness.", keywords: ["ml","fairness"] },
  { id: "northwestern-cs", school: "Northwestern", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "USA", city: "Evanston, IL", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "HCI, AI.", keywords: ["hci","ai"] },
  { id: "ox-cs-phd", school: "Oxford", program: "DPhil in Computer Science", degree: "PhD", field: "Computer Science", country: "UK", city: "Oxford", deadline: "2027-01-12", greRequired: false, funding: "Varies", notes: "Strong theory.", keywords: ["theory","ml"] },
  { id: "cam-cs-phd", school: "Cambridge", program: "PhD in Computer Science", degree: "PhD", field: "Computer Science", country: "UK", city: "Cambridge", deadline: "2026-12-02", greRequired: false, funding: "Varies", notes: "NLP, security.", keywords: ["nlp","security"] },
  { id: "imperial-cs-ms", school: "Imperial College London", program: "MSc Computing (AI/ML)", degree: "MS", field: "Computer Science", country: "UK", city: "London", deadline: "2027-01-31", greRequired: false, funding: "Partial", notes: "AI specialisation.", keywords: ["ai","ml"] },
  { id: "ucl-cs-ms", school: "UCL", program: "MSc Machine Learning", degree: "MS", field: "Machine Learning", country: "UK", city: "London", deadline: "2027-03-30", greRequired: false, funding: "Partial", notes: "Highly selective.", keywords: ["ml","deep learning"] },
  { id: "ethz-cs-ms", school: "ETH Zürich", program: "MSc Computer Science", degree: "MS", field: "Computer Science", country: "Switzerland", city: "Zürich", deadline: "2026-12-15", greRequired: false, funding: "Partial", notes: "Low tuition, strong research.", keywords: ["systems","ml"] },
  { id: "epfl-cs-ms", school: "EPFL", program: "MSc Computer Science", degree: "MS", field: "Computer Science", country: "Switzerland", city: "Lausanne", deadline: "2026-12-15", greRequired: false, funding: "Partial", notes: "Strong AI lab.", keywords: ["ai","systems"] },
  { id: "tum-cs-ms", school: "TU Munich", program: "MSc Informatics", degree: "MS", field: "Computer Science", country: "Germany", city: "Munich", deadline: "2027-01-15", greRequired: false, funding: "Full", notes: "Free tuition.", keywords: ["systems","ai"] },
  { id: "kth-cs-ms", school: "KTH Stockholm", program: "MSc ML", degree: "MS", field: "Machine Learning", country: "Sweden", city: "Stockholm", deadline: "2027-01-15", greRequired: false, funding: "Varies", notes: "EU-funded scholarships.", keywords: ["ml"] },
  { id: "toronto-cs-phd", school: "University of Toronto", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "Canada", city: "Toronto", deadline: "2026-12-01", greRequired: false, funding: "Full", notes: "Vector Institute.", keywords: ["ml","deep learning"] },
  { id: "ubc-cs-ms", school: "UBC", program: "MSc Computer Science", degree: "MS", field: "Computer Science", country: "Canada", city: "Vancouver", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "AI, vision.", keywords: ["ai","vision"] },
  { id: "mcgill-cs-phd", school: "McGill", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "Canada", city: "Montreal", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "MILA collaboration.", keywords: ["ml","rl"] },
  { id: "waterloo-cs-ms", school: "Waterloo", program: "MMath Computer Science", degree: "MS", field: "Computer Science", country: "Canada", city: "Waterloo", deadline: "2027-02-01", greRequired: false, funding: "Full", notes: "Industry ties.", keywords: ["systems","ai"] },
  { id: "nus-cs-phd", school: "NUS", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "Singapore", city: "Singapore", deadline: "2026-11-15", greRequired: false, funding: "Full", notes: "NUS Scholarship.", keywords: ["systems","db"] },
  { id: "ntu-cs-phd", school: "NTU Singapore", program: "Computer Science", degree: "PhD", field: "Computer Science", country: "Singapore", city: "Singapore", deadline: "2026-12-31", greRequired: false, funding: "Full", notes: "AI focus.", keywords: ["ai"] },
  { id: "hku-cs-ms", school: "HKU", program: "MSc Computer Science", degree: "MS", field: "Computer Science", country: "Hong Kong", city: "Hong Kong", deadline: "2027-01-31", greRequired: false, funding: "Partial", notes: "AI track.", keywords: ["ai"] },
  { id: "tsinghua-cs-ms", school: "Tsinghua", program: "MSc Computer Science", degree: "MS", field: "Computer Science", country: "China", city: "Beijing", deadline: "2026-12-15", greRequired: false, funding: "Full", notes: "Research-heavy.", keywords: ["ml","systems"] },
  { id: "iisc-cs-phd", school: "IISc Bangalore", program: "CSA PhD", degree: "PhD", field: "Computer Science", country: "India", city: "Bangalore", deadline: "2026-12-01", greRequired: false, funding: "Full", notes: "Top Indian CS dept.", keywords: ["theory","ml"] },
  { id: "iit-bombay-cs", school: "IIT Bombay", program: "MTech CSE", degree: "MS", field: "Computer Science", country: "India", city: "Mumbai", deadline: "2027-02-15", greRequired: false, funding: "Full", notes: "GATE-based.", keywords: ["systems","ml"] },
  { id: "stanford-bme-phd", school: "Stanford", program: "Bioengineering", degree: "PhD", field: "Bioengineering", country: "USA", city: "Stanford, CA", deadline: "2026-12-01", greRequired: false, funding: "Full", notes: "Bio + ML.", keywords: ["bioinformatics","ml"] },
  { id: "harvard-stat-phd", school: "Harvard", program: "Statistics", degree: "PhD", field: "Statistics", country: "USA", city: "Cambridge, MA", deadline: "2026-12-01", greRequired: true, funding: "Full", notes: "Strong theory.", keywords: ["statistics","theory"] },
  { id: "wharton-mba", school: "Wharton", program: "MBA", degree: "MBA", field: "Business", country: "USA", city: "Philadelphia, PA", deadline: "2027-01-04", greRequired: false, funding: "None", notes: "Top US business school.", keywords: ["mba","business"] },
  { id: "lse-data-ms", school: "LSE", program: "MSc Data Science", degree: "MS", field: "Data Science", country: "UK", city: "London", deadline: "2027-04-25", greRequired: false, funding: "Partial", notes: "Social-science angle.", keywords: ["data science","stats"] },
];
