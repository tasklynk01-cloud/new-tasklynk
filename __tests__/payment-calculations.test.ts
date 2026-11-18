/**
 * Unit tests for payment-calculations.ts
 * Tests all financial calculation functions to prevent monetary errors
 */

import { describe, it, expect } from '@jest/globals';
import {
  isTechnicalWorkType,
  writerCPP,
  writerPerSlide,
  clientMinCPP,
  clientMinCPS,
  calculateWriterPayout,
  calculateWriterEarnings,
  minRequiredClientAmount,
  minRequiredClientSlideAmount,
  managerAssignFee,
  managerSubmitFee,
  calculateManagerEarnings,
  calculateWriterPayoutByCPPLevel,
  calculateWriterEarningsByCPPLevel,
  getFreelancerCPPRate,
  calculateUrgentSurcharge,
  isUrgentOrder,
} from '@/lib/payment-calculations';

describe('Payment Calculations - Technical Work Detection', () => {
  it('should detect Excel as technical work', () => {
    expect(isTechnicalWorkType('Excel Spreadsheet')).toBe(true);
    expect(isTechnicalWorkType('excel analysis')).toBe(true);
  });

  it('should detect SPSS as technical work', () => {
    expect(isTechnicalWorkType('SPSS Data Analysis')).toBe(true);
    expect(isTechnicalWorkType('spss statistics')).toBe(true);
  });

  it('should detect PowerPoint as technical work', () => {
    expect(isTechnicalWorkType('PowerPoint Presentation')).toBe(true);
    expect(isTechnicalWorkType('powerpoint slides')).toBe(true);
  });

  it('should detect programming languages as technical', () => {
    expect(isTechnicalWorkType('Python coding')).toBe(true);
    expect(isTechnicalWorkType('R programming')).toBe(true);
  });

  it('should NOT detect essay writing as technical', () => {
    expect(isTechnicalWorkType('Essay Writing')).toBe(false);
    expect(isTechnicalWorkType('Research Paper')).toBe(false);
  });

  it('should handle null/undefined work types', () => {
    expect(isTechnicalWorkType(null)).toBe(false);
    expect(isTechnicalWorkType(undefined)).toBe(false);
    expect(isTechnicalWorkType('')).toBe(false);
  });
});

describe('Payment Calculations - Writer CPP Rates', () => {
  it('should return Starter tier CPP for technical work by default', () => {
    expect(writerCPP('Excel')).toBe(170);
    expect(writerCPP('PowerPoint')).toBe(170);
  });

  it('should return Starter tier CPP for non-technical work by default', () => {
    expect(writerCPP('Essay')).toBe(150);
    expect(writerCPP('Research Paper')).toBe(150);
  });

  it('should treat null/undefined as non-technical starter tier', () => {
    expect(writerCPP(null)).toBe(150);
    expect(writerCPP(undefined)).toBe(150);
  });

  it('should respect completed order counts for higher tiers', () => {
    expect(writerCPP('Essay', 50)).toBe(200);
    expect(writerCPP('Excel', 50)).toBe(220);
  });

  it('should return 100 per slide consistently', () => {
    expect(writerPerSlide()).toBe(100);
  });
});

describe('Payment Calculations - Client Minimums', () => {
  it('should return 270 CPP minimum for technical work', () => {
    expect(clientMinCPP('Excel')).toBe(270);
    expect(clientMinCPP('SPSS')).toBe(270);
  });

  it('should return 240 CPP minimum for non-technical work', () => {
    expect(clientMinCPP('Essay')).toBe(240);
    expect(clientMinCPP(null)).toBe(240);
  });

  it('should return 150 CPS minimum for slides', () => {
    expect(clientMinCPS()).toBe(150);
  });

  it('should calculate minimum client amount for pages', () => {
    expect(minRequiredClientAmount(5, 'Essay')).toBe(1200); // 5 * 240
    expect(minRequiredClientAmount(3, 'Excel')).toBe(810);  // 3 * 270
  });

  it('should calculate minimum client amount for slides', () => {
    expect(minRequiredClientSlideAmount(10)).toBe(1500); // 10 * 150
  });

  it('should handle zero/null pages gracefully', () => {
    expect(minRequiredClientAmount(0)).toBe(0);
    expect(minRequiredClientAmount(null)).toBe(0);
  });
});

describe('Payment Calculations - Writer Payout (Legacy)', () => {
  it('should calculate writer payout for pages only using starter tier when no history provided', () => {
    expect(calculateWriterPayout(5, 'Essay')).toBe(750);     // 5 * 150
    expect(calculateWriterPayout(5, 'Excel')).toBe(850);     // 5 * 170
  });

  it('should calculate writer payout for pages when completed orders are supplied', () => {
    expect(calculateWriterPayout(5, 'Essay', 50)).toBe(1000);     // 5 * 200 (Master tier)
    expect(calculateWriterPayout(5, 'Excel', 23)).toBe(1000);    // 5 * 200 (Expert technical)
  });

  it('should calculate writer earnings for pages + slides using starter tier by default', () => {
    expect(calculateWriterEarnings(5, 0, 'Essay')).toBe(750);      // 5*150 + 0*100
    expect(calculateWriterEarnings(5, 10, 'Essay')).toBe(1750);    // 5*150 + 10*100
    expect(calculateWriterEarnings(3, 5, 'Excel')).toBe(1010);     // 3*170 + 5*100
  });

  it('should calculate writer earnings with completed orders context', () => {
    expect(calculateWriterEarnings(5, 0, 'Essay', 27)).toBe(900);      // Expert non-technical
    expect(calculateWriterEarnings(5, 10, 'Essay', 50)).toBe(2000);    // Master non-technical + slides
    expect(calculateWriterEarnings(3, 5, 'Excel', 50)).toBe(1160);     // Master technical + slides
  });

  it('should handle null/zero values in writer earnings with minimum guarantee', () => {
    // 🔴 MINIMUM EARNINGS GUARANTEE: Even with 0 pages/slides, minimum earnings apply
    // Non-technical minimum: 150, Technical minimum: 170
    expect(calculateWriterEarnings(null, null, 'Essay')).toBe(150);  // Minimum guarantee
    expect(calculateWriterEarnings(0, 0, 'Essay')).toBe(150);        // Minimum guarantee
    expect(calculateWriterEarnings(5, null, 'Essay')).toBe(750);     // 5*150
  });

  it('should round to 2 decimal places', () => {
    expect(calculateWriterEarnings(3.5, 2.7, 'Essay')).toBe(795); // (3.5*150) + (2.7*100) rounded
  });
});

describe('Payment Calculations - CPP Level System', () => {
  it('should calculate Starter tier rates (0-2 orders)', () => {
    // Non-technical: 150 CPP
    expect(getFreelancerCPPRate('Essay', 0)).toBe(150);
    expect(getFreelancerCPPRate('Essay', 2)).toBe(150);
    
    // Technical: 170 CPP (150 + 20 bonus)
    expect(getFreelancerCPPRate('Excel', 0)).toBe(170);
    expect(getFreelancerCPPRate('Excel', 2)).toBe(170);
  });

  it('should calculate Rising tier rates (3-7 orders)', () => {
    // Non-technical: 160 CPP
    expect(getFreelancerCPPRate('Essay', 3)).toBe(160);
    expect(getFreelancerCPPRate('Essay', 7)).toBe(160);
    
    // Technical: 180 CPP
    expect(getFreelancerCPPRate('SPSS', 3)).toBe(180);
    expect(getFreelancerCPPRate('SPSS', 7)).toBe(180);
  });

  it('should calculate Established tier rates (8-22 orders)', () => {
    // Non-technical: 170 CPP
    expect(getFreelancerCPPRate('Essay', 8)).toBe(170);
    expect(getFreelancerCPPRate('Essay', 15)).toBe(170);
    
    // Technical: 190 CPP
    expect(getFreelancerCPPRate('PowerPoint', 8)).toBe(190);
    expect(getFreelancerCPPRate('PowerPoint', 22)).toBe(190);
  });

  it('should calculate Expert tier rates (23-49 orders)', () => {
    // Non-technical: 180 CPP
    expect(getFreelancerCPPRate('Essay', 23)).toBe(180);
    expect(getFreelancerCPPRate('Essay', 40)).toBe(180);
    
    // Technical: 200 CPP
    expect(getFreelancerCPPRate('Excel', 23)).toBe(200);
    expect(getFreelancerCPPRate('Excel', 49)).toBe(200);
  });

  it('should calculate Master tier rates (50+ orders)', () => {
    // Non-technical: 200 CPP
    expect(getFreelancerCPPRate('Essay', 50)).toBe(200);
    expect(getFreelancerCPPRate('Essay', 100)).toBe(200);
    
    // Technical: 220 CPP
    expect(getFreelancerCPPRate('Python', 50)).toBe(220);
    expect(getFreelancerCPPRate('Python', 200)).toBe(220);
  });

  it('should calculate writer payout by CPP level for pages', () => {
    // Starter: 5 pages * 150 = 750
    expect(calculateWriterPayoutByCPPLevel(5, 'Essay', 0)).toBe(750);
    
    // Rising: 5 pages * 160 = 800
    expect(calculateWriterPayoutByCPPLevel(5, 'Essay', 3)).toBe(800);
    
    // Expert: 5 pages * 180 = 900
    expect(calculateWriterPayoutByCPPLevel(5, 'Essay', 23)).toBe(900);
    
    // Master technical: 5 pages * 220 = 1100
    expect(calculateWriterPayoutByCPPLevel(5, 'Excel', 50)).toBe(1100);
  });

  it('should calculate writer earnings by CPP level with slides', () => {
    // Starter: (5*150) + (10*100) = 1750
    expect(calculateWriterEarningsByCPPLevel(5, 10, 'Essay', 0)).toBe(1750);
    
    // Expert: (5*180) + (10*100) = 1900
    expect(calculateWriterEarningsByCPPLevel(5, 10, 'Essay', 23)).toBe(1900);
    
    // Master technical: (5*220) + (10*100) = 2100
    expect(calculateWriterEarningsByCPPLevel(5, 10, 'SPSS', 50)).toBe(2100);
  });

  it('should handle edge cases in CPP calculations with minimum guarantee', () => {
    // 🔴 MINIMUM EARNINGS GUARANTEE: Even with 0 pages/slides, minimum earnings apply
    expect(calculateWriterEarningsByCPPLevel(null, null, 'Essay', 0)).toBe(150);  // Minimum guarantee
    expect(calculateWriterEarningsByCPPLevel(0, 0, 'Essay', 0)).toBe(150);        // Minimum guarantee
    expect(calculateWriterEarningsByCPPLevel(5, null, 'Essay', 0)).toBe(750);
  });
});

describe('Payment Calculations - Manager Earnings', () => {
  it('should return 10 KES for assignment fee', () => {
    expect(managerAssignFee()).toBe(10);
  });

  it('should calculate submit fee correctly', () => {
    expect(managerSubmitFee(1)).toBe(10);  // 10 + 5*(1-1) = 10
    expect(managerSubmitFee(2)).toBe(15);  // 10 + 5*(2-1) = 15
    expect(managerSubmitFee(5)).toBe(30);  // 10 + 5*(5-1) = 30
    expect(managerSubmitFee(10)).toBe(55); // 10 + 5*(10-1) = 55
  });

  it('should handle zero pages in submit fee', () => {
    expect(managerSubmitFee(0)).toBe(0);
    expect(managerSubmitFee(null)).toBe(0);
  });

  it('should calculate total manager earnings', () => {
    // Only assigned
    expect(calculateManagerEarnings({ assigned: true, submitted: false, pages: 0 })).toBe(10);
    
    // Assigned + submitted 1 page
    expect(calculateManagerEarnings({ assigned: true, submitted: true, pages: 1 })).toBe(20);
    
    // Assigned + submitted 5 pages
    expect(calculateManagerEarnings({ assigned: true, submitted: true, pages: 5 })).toBe(40);
    
    // Only submitted (edge case)
    expect(calculateManagerEarnings({ assigned: false, submitted: true, pages: 5 })).toBe(30);
  });
});

describe('Payment Calculations - Urgent Surcharges', () => {
  it('should return 60 KES for very urgent orders (0-3 hours)', () => {
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    expect(calculateUrgentSurcharge(deadline, 1000)).toBe(60);
  });

  it('should return 50 KES for urgent orders (3-5 hours)', () => {
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    expect(calculateUrgentSurcharge(deadline, 1000)).toBe(50);
  });

  it('should return 40 KES for moderately urgent orders (5-8 hours)', () => {
    const deadline = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now
    expect(calculateUrgentSurcharge(deadline, 1000)).toBe(40);
  });

  it('should return 0 for non-urgent orders (>8 hours)', () => {
    const deadline = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours from now
    expect(calculateUrgentSurcharge(deadline, 1000)).toBe(0);
  });

  it('should return 0 for past deadlines', () => {
    const deadline = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(calculateUrgentSurcharge(deadline, 1000)).toBe(0);
  });

  it('should return 0 for null deadline', () => {
    expect(calculateUrgentSurcharge(null, 1000)).toBe(0);
    expect(calculateUrgentSurcharge(undefined, 1000)).toBe(0);
  });

  it('should correctly identify urgent orders', () => {
    const urgent = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const notUrgent = new Date(Date.now() + 10 * 60 * 60 * 1000);
    
    expect(isUrgentOrder(urgent)).toBe(true);
    expect(isUrgentOrder(notUrgent)).toBe(false);
    expect(isUrgentOrder(null)).toBe(false);
  });
});

describe('Payment Calculations - Edge Cases & Error Handling', () => {
  it('should handle negative values gracefully', () => {
    expect(calculateWriterPayout(-5, 'Essay')).toBe(0);
    expect(calculateWriterEarnings(-3, -2, 'Essay')).toBe(0);
    expect(minRequiredClientAmount(-5)).toBe(0);
  });

  it('should handle very large numbers', () => {
    expect(calculateWriterPayout(1000, 'Essay')).toBe(200000);
    expect(calculateWriterEarnings(500, 500, 'Essay')).toBe(150000);
  });

  it('should handle decimal pages/slides correctly', () => {
    // Should round properly
    expect(calculateWriterPayout(5.5, 'Essay')).toBe(1100); // 5.5 * 200
    expect(calculateWriterEarnings(3.5, 2.5, 'Essay')).toBe(950); // (3.5*200) + (2.5*100)
  });

  it('should maintain precision in calculations', () => {
    const result = calculateWriterEarnings(7, 13, 'Excel');
    expect(result).toBe(3190); // (7*270) + (13*100) = 1890 + 1300
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('Payment Calculations - Real-World Scenarios', () => {
  it('should correctly calculate a typical 5-page essay order', () => {
    const pages = 5;
    const workType = 'Essay';
    const completedOrders = 0; // Starter freelancer
    
    const clientMin = minRequiredClientAmount(pages, workType);
    const writerPayout = calculateWriterPayoutByCPPLevel(pages, workType, completedOrders);
    const managerEarnings = calculateManagerEarnings({ assigned: true, submitted: true, pages });
    
    expect(clientMin).toBe(1200);      // 5 * 240
    expect(writerPayout).toBe(750);    // 5 * 150 (Starter)
    expect(managerEarnings).toBe(40);  // 10 + (10 + 5*4)
    
    const adminProfit = clientMin - (writerPayout + managerEarnings);
    expect(adminProfit).toBe(410);     // 1200 - 750 - 40
  });

  it('should correctly calculate a technical Excel order', () => {
    const pages = 3;
    const workType = 'Excel Analysis';
    const completedOrders = 23; // Expert freelancer
    
    const clientMin = minRequiredClientAmount(pages, workType);
    const writerPayout = calculateWriterPayoutByCPPLevel(pages, workType, completedOrders);
    const managerEarnings = calculateManagerEarnings({ assigned: true, submitted: true, pages });
    
    expect(clientMin).toBe(810);       // 3 * 270
    expect(writerPayout).toBe(600);    // 3 * 200 (Expert technical)
    expect(managerEarnings).toBe(30);  // 10 + (10 + 5*2)
    
    const adminProfit = clientMin - (writerPayout + managerEarnings);
    expect(adminProfit).toBe(180);     // 810 - 600 - 30
  });

  it('should correctly calculate a PowerPoint presentation', () => {
    const pages = 0;
    const slides = 20;
    const workType = 'PowerPoint';
    const completedOrders = 5; // Established freelancer
    
    const clientMin = minRequiredClientSlideAmount(slides);
    const writerEarnings = calculateWriterEarningsByCPPLevel(pages, slides, workType, completedOrders);
    const managerEarnings = calculateManagerEarnings({ assigned: true, submitted: true, pages });
    
    expect(clientMin).toBe(3000);      // 20 * 150
    expect(writerEarnings).toBe(2000); // 20 * 100
    expect(managerEarnings).toBe(10);  // 10 (only assign fee, no pages)
    
    const adminProfit = clientMin - (writerEarnings + managerEarnings);
    expect(adminProfit).toBe(990);     // 3000 - 2000 - 10
  });
});
