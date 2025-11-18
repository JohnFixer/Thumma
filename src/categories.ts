// categories.ts
import type { Language, LocalizedString } from './types';

export interface SubCategory {
  key: string;
  name: LocalizedString;
  description: LocalizedString;
  examples: LocalizedString;
}

export interface MainCategory {
  key: string;
  name: LocalizedString;
  subCategories: SubCategory[];
}

export const CATEGORIES: MainCategory[] = [
  {
    key: 'building_materials',
    name: { en: 'Building & Construction Materials', th: 'วัสดุก่อสร้าง' },
    subCategories: [
      {
        key: 'cement_aggregates',
        name: { en: 'Cement & Aggregates', th: 'ปูนและมวลรวม' },
        description: {
          en: 'Basic materials for concrete mixing and foundational work, including various types of cement and aggregates like sand and gravel.',
          th: 'วัสดุพื้นฐานสำหรับงานผสมคอนกรีตและงานฐานราก รวมถึงปูนซีเมนต์ประเภทต่างๆ และมวลรวมเช่น ทราย และหิน'
        },
        examples: {
          en: 'Portland Cement, Masonry Cement, Premixed Concrete, Sand Bags, Gravel',
          th: 'ปูนซีเมนต์ปอร์ตแลนด์, ปูนก่อ, ปูนสำเร็จรูป, ทรายถุง, หินคลุก'
        }
      },
      {
        key: 'steel_metal',
        name: { en: 'Steel & Metal', th: 'เหล็กและโลหะ' },
        description: {
          en: 'Structural and reinforcement steel products used in construction framing and concrete reinforcement.',
          th: 'ผลิตภัณฑ์เหล็กโครงสร้างและเหล็กเสริมที่ใช้ในงานโครงสร้างอาคารและเสริมคอนกรีต'
        },
        examples: {
          en: 'Rebar, Steel Bars (Round/Deformed), Wire Mesh, C-channel Steel, Steel Plate',
          th: 'เหล็กเส้นกลม, เหล็กข้ออ้อย, ไวร์เมช, เหล็กตัวซี, เหล็กแผ่น'
        }
      },
      {
        key: 'bricks_blocks',
        name: { en: 'Bricks & Blocks', th: 'อิฐและบล็อก' },
        description: {
          en: 'Masonry units for constructing walls and partitions.',
          th: 'วัสดุสำหรับงานก่อผนังและกำแพง'
        },
        examples: {
          en: 'Concrete Blocks, Red Bricks, Lightweight AAC Blocks, Decorative Blocks',
          th: 'อิฐบล็อก, อิฐแดง, อิฐมวลเบา, อิฐช่องลม'
        }
      },
      {
        key: 'wood_boards',
        name: { en: 'Wood & Boards', th: 'ไม้และแผ่นวัสดุ' },
        description: {
          en: 'Lumber, engineered wood, and various types of boards for structural, finishing, and partitioning purposes.',
          th: 'ไม้แปรรูป, ไม้เอ็นจิเนียร์ และแผ่นวัสดุประเภทต่างๆ สำหรับงานโครงสร้าง, งานตกแต่ง และผนัง'
        },
        examples: {
          en: 'Lumber, Plywood, Fiber Cement Board (Shera/Smartboard), Gypsum Board',
          th: 'ไม้แปรรูป, ไม้อัด, แผ่นไฟเบอร์ซีเมนต์ (เฌอร่า/สมาร์ทบอร์ด), แผ่นยิปซัม'
        }
      },
       {
        key: 'roofing_insulation',
        name: { en: 'Roofing & Insulation', th: 'หลังคาและฉนวน' },
        description: {
          en: 'Materials for roof construction and thermal/acoustic insulation.',
          th: 'วัสดุสำหรับงานมุงหลังคาและฉนวนกันความร้อน/เสียง'
        },
        examples: {
          en: 'Concrete Roof Tiles, Metal Sheet Roofing, Heat Insulation Sheets, Waterproofing Membrane',
          th: 'กระเบื้องหลังคาคอนกรีต, เมทัลชีท, แผ่นฉนวนกันความร้อน, แผ่นกันซึม'
        }
      },
    ]
  },
  {
    key: 'tools_equipment',
    name: { en: 'Tools & Equipment', th: 'เครื่องมือและอุปกรณ์' },
    subCategories: [
        {
            key: 'hand_tools',
            name: { en: 'Hand Tools', th: 'เครื่องมือช่าง' },
            description: {
              en: 'Manual tools for general construction, repair, and maintenance tasks.',
              th: 'เครื่องมือที่ใช้แรงคนสำหรับงานก่อสร้าง, ซ่อมแซม และบำรุงรักษาทั่วไป'
            },
            examples: {
              en: 'Hammers, Screwdrivers, Wrenches, Pliers, Hand Saws, Trowels',
              th: 'ค้อน, ไขควง, ประแจ, คีม, เลื่อยมือ, เกรียง'
            }
        },
        {
            key: 'power_tools',
            name: { en: 'Power Tools', th: 'เครื่องมือไฟฟ้า' },
            description: {
              en: 'Electrically powered tools for cutting, drilling, grinding, and other heavy-duty tasks.',
              th: 'เครื่องมือที่ใช้ไฟฟ้าสำหรับงานตัด, เจาะ, ขัด และงานหนักอื่นๆ'
            },
            examples: {
              en: 'Electric Drills, Angle Grinders, Sanders, Circular Saws, Welding Machines',
              th: 'สว่านไฟฟ้า, ลูกหมู (เครื่องเจียร), เครื่องขัด, เลื่อยวงเดือน, ตู้เชื่อม'
            }
        },
        {
            key: 'safety_gear',
            name: { en: 'Safety Gear', th: 'อุปกรณ์นิรภัย' },
            description: {
              en: 'Personal Protective Equipment (PPE) to ensure worker safety on site.',
              th: 'อุปกรณ์ป้องกันส่วนบุคคล (PPE) เพื่อความปลอดภัยของคนงานในไซต์งาน'
            },
            examples: {
              en: 'Safety Helmets, Work Gloves, Safety Glasses, Dust Masks, Safety Boots',
              th: 'หมวกนิรภัย, ถุงมือ, แว่นตานิรภัย, หน้ากากกันฝุ่น, รองเท้าเซฟตี้'
            }
        },
    ]
  },
  {
    key: 'plumbing_water',
    name: { en: 'Plumbing & Water Systems', th: 'ระบบประปาและสุขภัณฑ์' },
    subCategories: [
        {
            key: 'pipes_fittings',
            name: { en: 'Pipes & Fittings', th: 'ท่อและข้อต่อ' },
            description: {
              en: 'Pipes and connectors for water supply and drainage systems.',
              th: 'ท่อและอุปกรณ์เชื่อมต่อสำหรับระบบน้ำดีและน้ำทิ้ง'
            },
            examples: {
              en: 'PVC Pipes, PVC Fittings (Elbows, Tees), Ball Valves, Pipe Glue',
              th: 'ท่อ PVC, ข้อต่อ PVC (ข้องอ, สามทาง), บอลวาล์ว, กาวทาท่อ'
            }
        },
        {
            key: 'pumps_tanks',
            name: { en: 'Pumps & Tanks', th: 'ปั๊มและแทงค์น้ำ' },
            description: {
              en: 'Equipment for water storage and distribution within a building.',
              th: 'อุปกรณ์สำหรับกักเก็บและจ่ายน้ำภายในอาคาร'
            },
            examples: {
              en: 'Water Pumps, Water Tanks, Pressure Boosters',
              th: 'ปั๊มน้ำอัตโนมัติ, แทงค์น้ำ, ปั๊มเพิ่มแรงดัน'
            }
        },
    ]
  },
  {
    key: 'electrical',
    name: { en: 'Electrical Systems', th: 'ระบบไฟฟ้า' },
    subCategories: [
        {
            key: 'wiring_conduits',
            name: { en: 'Wiring & Conduits', th: 'สายไฟและท่อร้อยสาย' },
            description: {
              en: 'Cables and protective conduits for electrical installations.',
              th: 'สายเคเบิลและท่อป้องกันสำหรับงานติดตั้งระบบไฟฟ้า'
            },
            examples: {
              en: 'THW Wire, VAF Wire, Electrical Conduits (PVC/Metal), Cable Ties',
              th: 'สายไฟ THW, สาย VAF, ท่อร้อยสายไฟ (PVC/โลหะ), เคเบิ้ลไทร์'
            }
        },
        {
            key: 'lighting_switches',
            name: { en: 'Lighting, Switches & Outlets', th: 'แสงสว่างและสวิตช์' },
            description: {
              en: 'Fixtures for lighting, and devices for controlling electrical circuits.',
              th: 'อุปกรณ์ให้แสงสว่างและอุปกรณ์ควบคุมวงจรไฟฟ้า'
            },
            examples: {
              en: 'LED Bulbs, Light Switches, Electrical Outlets, Breakers, Electrical Tape',
              th: 'หลอดไฟ LED, สวิตช์ไฟ, เต้ารับ, เบรกเกอร์, เทปพันสายไฟ'
            }
        },
    ]
  },
  {
    key: 'paints_chemicals',
    name: { en: 'Paints & Chemicals', th: 'สีและเคมีภัณฑ์' },
    subCategories: [
        {
            key: 'paints_primers',
            name: { en: 'Paints & Primers', th: 'สีและสีรองพื้น' },
            description: {
              en: 'Coatings for finishing and protecting surfaces, including interior, exterior, and primer paints.',
              th: 'ผลิตภัณฑ์เคลือบผิวสำหรับตกแต่งและป้องกันพื้นผิว ทั้งสีทาภายใน, ภายนอก และสีรองพื้น'
            },
            examples: {
              en: 'Interior Emulsion Paint, Exterior Acrylic Paint, Metal Primer, Wood Stain',
              th: 'สีน้ำทาภายใน, สีอะคริลิคทาภายนอก, สีรองพื้นกันสนิม, สีย้อมไม้'
            }
        },
        {
            key: 'painting_tools',
            name: { en: 'Painting Tools', th: 'อุปกรณ์ทาสี' },
            description: {
              en: 'Tools and supplies required for paint application.',
              th: 'เครื่องมือและอุปกรณ์ที่จำเป็นสำหรับงานทาสี'
            },
            examples: {
              en: 'Paint Brushes, Rollers, Paint Trays, Masking Tape, Thinner',
              th: 'แปรงทาสี, ลูกกลิ้ง, ถาดสี, กระดาษกาว, ทินเนอร์'
            }
        },
        {
            key: 'sealants_adhesives',
            name: { en: 'Sealants & Adhesives', th: 'เคมีภัณฑ์และกาว' },
            description: {
              en: 'Chemical products for sealing joints, waterproofing, and bonding materials.',
              th: 'ผลิตภัณฑ์เคมีสำหรับอุดรอยต่อ, กันซึม, และยึดติดวัสดุ'
            },
            examples: {
              en: 'Silicone Sealant, Acrylic Sealant, Construction Adhesive, Waterproofing Solution',
              th: 'ซิลิโคน, อะคริลิค, กาวตะปู, น้ำยากันซึม'
            }
        },
    ]
  },
  {
    key: 'hardware_supplies',
    name: { en: 'Hardware & Supplies', th: 'ฮาร์ดแวร์และวัสดุสิ้นเปลือง' },
    subCategories: [
        {
            key: 'fasteners',
            name: { en: 'Fasteners', th: 'สกรูและน็อต' },
            description: {
              en: 'Items used to mechanically join or affix objects together.',
              th: 'อุปกรณ์สำหรับยึดหรือติดวัตถุเข้าด้วยกัน'
            },
            examples: {
              en: 'Screws, Nails, Bolts & Nuts, Wall Anchors, Rivets',
              th: 'สกรู, ตะปู, น็อต, พุก, รีเวท'
            }
        },
        {
            key: 'door_window_hardware',
            name: { en: 'Door & Window Hardware', th: 'ฮาร์ดแวร์ประตู-หน้าต่าง' },
            description: {
              en: 'Functional and decorative hardware for doors and windows.',
              th: 'อุปกรณ์สำหรับติดตั้งและตกแต่งประตูและหน้าต่าง'
            },
            examples: {
              en: 'Hinges, Door Knobs, Locks, Cabinet Handles, Window Latches',
              th: 'บานพับ, ลูกบิด, กุญแจ, มือจับเฟอร์นิเจอร์, กลอนหน้าต่าง'
            }
        },
    ]
  },
];


export const getCategoryByKey = (fullKey: string | null | undefined): { main: MainCategory | undefined; sub: SubCategory | undefined } => {
    if (!fullKey) return { main: undefined, sub: undefined };
    const [mainKey, subKey] = fullKey.split('.');
    const main = CATEGORIES.find(c => c.key === mainKey);
    const sub = main?.subCategories.find(s => s.key === subKey);
    return { main, sub };
};

export const getCategoryDisplay = (fullKey: string, lang: Language): string => {
    const { main, sub } = getCategoryByKey(fullKey);
    if (!main || !sub) return fullKey; // fallback
    return `${main.name[lang]} > ${sub.name[lang]}`;
};

export const findCategoryKeyByNames = (mainName: string, subName: string): string | null => {
    for (const mainCat of CATEGORIES) {
        if (mainCat.name.en === mainName || mainCat.name.th === mainName) {
            for (const subCat of mainCat.subCategories) {
                if (subCat.name.en === subName || subCat.name.th === subName) {
                    return `${mainCat.key}.${subCat.key}`;
                }
            }
        }
    }
    return null;
};