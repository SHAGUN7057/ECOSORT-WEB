import { priorityFor, binStatus } from '../services/pickupService.js';

function assert(condition: boolean, message: string) { if (!condition) throw new Error(message); }
assert(priorityFor(92) === 'NORMAL', '92% should be a normal pickup alert');
assert(priorityFor(97) === 'HIGH', '97% should be high priority');
assert(priorityFor(100) === 'CRITICAL', '100% should be critical');
assert(binStatus([68, 44, 20, 12]) === 'NORMAL', 'Below 70% should be normal');
assert(binStatus([70, 44, 20, 12]) === 'MONITOR', '70% should be monitored');
assert(binStatus([92, 44, 20, 12]) === 'PICKUP_REQUIRED', '90% should request pickup');
console.log('Pickup threshold logic checks passed.');
