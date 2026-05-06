// EDI Parser function for n8n JavaScript node
function parseEDI(ediMessage) {
  // Define the data structure to store parsed results
  const result = {
    interchangeHeader: {},
    messageHeader: {},
    orderDetails: {},
    dates: [],
    parties: [],
    lineItems: []
  };
  
  // Split the message into lines and remove empty lines
  const lines = ediMessage.split("'").filter(line => line.trim().length > 0);
  
  // Parse each line
  let currentLineItem = null;
  
  for (const line of lines) {
    const segments = line.trim().split('+');
    const segmentName = segments[0];
    
    switch (segmentName) {
      case 'UNA':
        // Service String Advice - contains delimiter information
        break;
        
      case 'UNB':
        // Interchange Header
        // UNB+UNOC:3+SENDER_ID+RECEIVER_ID+240318:1200+ORDER54321
        result.interchangeHeader = {
          syntax: segments[1],
          senderId: segments[2],
          receiverId: segments[3],
          dateTime: segments[4]?.split(':')[0] || '',
          time: segments[4]?.split(':')[1] || '',
          controlReference: segments[5] || ''
        };
        break;
        
      case 'UNH':
        // Message Header
        // UNH+1+ORDERS:D:96A:UN
        if (segments.length > 2) {
          const messageParts = segments[2].split(':');
          result.messageHeader = {
            messageReference: segments[1],
            messageType: messageParts[0],
            messageVersion: messageParts[1],
            messageRelease: messageParts[2],
            controlAgency: messageParts[3]
          };
        }
        break;
        
      case 'BGM':
        // Beginning of Message
        // BGM+230+RT54321098+9
        result.orderDetails = {
          documentType: segments[1],
          documentNumber: segments[2],
          messageFunction: segments[3]
        };
        break;
        
      case 'DTM':
        // Date/Time/Period
        // DTM+137:20250319:102
        if (segments[1]) {
          const dateParts = segments[1].split(':');
          const dateObj = {
            qualifier: dateParts[0],
            date: dateParts[1],
            format: dateParts[2]
          };
          
          // Add human-readable description based on qualifier
          switch (dateParts[0]) {
            case '137':
              dateObj.description = 'Document Date';
              break;
            case '2':
              dateObj.description = 'Delivery Date';
              break;
            case '10':
              dateObj.description = 'Shipment Date';
              break;
            default:
              dateObj.description = 'Other Date';
          }
          
          result.dates.push(dateObj);
        }
        break;
      
      case 'NAD':
        // Name and Address
        // NAD+BY+CUSTOMER_123::91
        if (segments.length > 1) {
          const partyCode = segments[1];
          const partyId = segments[2]?.split(':')[0] || '';
          
          const party = {
            partyQualifier: partyCode,
            partyId: partyId,
            qualifierDescription: ''
          };
          
          // Add human-readable description
          switch (partyCode) {
            case 'BY':
              party.qualifierDescription = 'Buyer';
              break;
            case 'SU':
              party.qualifierDescription = 'Supplier';
              break;
            case 'DP':
              party.qualifierDescription = 'Delivery Party';
              break;
            default:
              party.qualifierDescription = 'Other Party';
          }
          
          // If there's a full name instead of a code (like "Returns Processing Hub")
          if (segments[2] && !segments[2].includes(':')) {
            party.partyName = segments[2];
            party.partyId = '';
          }
          
          result.parties.push(party);
        }
        break;
      
      case 'LIN':
        // Line Item
        // LIN+1++321654:IN
        currentLineItem = {
          lineNumber: segments[1],
          productId: '',
          productIdType: '',
          description: '',
          quantity: 0,
          unit: '',
          price: 0
        };
        
        // Parse product ID if present
        if (segments[3]) {
          const productParts = segments[3].split(':');
          currentLineItem.productId = productParts[0];
          currentLineItem.productIdType = productParts[1] || '';
        }
        
        result.lineItems.push(currentLineItem);
        break;
      
      case 'IMD':
        // Item Description
        // IMD+F++:::Defective Product A
        if (currentLineItem && segments.length > 3) {
          // The description is typically in the last component after multiple colons
          const descriptionParts = segments[3].split(':');
          currentLineItem.description = descriptionParts[descriptionParts.length - 1];
        }
        break;
      
      case 'QTY':
        // Quantity
        // QTY+21:10:EA
        if (currentLineItem && segments[1]) {
          const quantityParts = segments[1].split(':');
          currentLineItem.quantityQualifier = quantityParts[0];
          currentLineItem.quantity = parseFloat(quantityParts[1] || '0');
          currentLineItem.unit = quantityParts[2] || '';
        }
        break;
      
      case 'PRI':
        // Price Details
        // PRI+AAA:0.00
        if (currentLineItem && segments[1]) {
          const priceParts = segments[1].split(':');
          currentLineItem.priceQualifier = priceParts[0];
          currentLineItem.price = parseFloat(priceParts[1] || '0');
        }
        break;
      
      case 'UNT':
        // Message Trailer
        break;
      
      case 'UNZ':
        // Interchange Trailer
        break;
    }
  }
  
  // Add some summary info
  result.summary = {
    documentType: 'Return Order',
    documentNumber: result.orderDetails.documentNumber,
    orderDate: result.dates.find(d => d.qualifier === '137')?.date || '',
    lineItemCount: result.lineItems.length,
    totalQuantity: result.lineItems.reduce((sum, item) => sum + item.quantity, 0)
  };
  
  return result;
}

// Return the parsed EDI data
const ediMessage =  $input.first().json.body;

if (!ediMessage) {
  throw new Error('No EDI message found in input. Please provide the EDI message in the "ediMessage" property.');
}

const parsedData = parseEDI(ediMessage);
return { json: parsedData };