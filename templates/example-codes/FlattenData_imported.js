// EDI to Flattened Tabular Data Transformer for n8n JavaScript node
function transformToFlattened(parsedEDI) {
  const flattened = [];
  
  // Create a header object with all order header fields
  const headerObj = {
    header_Document_Type: parsedEDI.orderDetails.documentType || '',
    header_Document_Number: parsedEDI.orderDetails.documentNumber || '',
    header_Message_Function: parsedEDI.orderDetails.messageFunction || '',
    header_Sender_ID: parsedEDI.interchangeHeader.senderId || '',
    header_Receiver_ID: parsedEDI.interchangeHeader.receiverId || '',
    header_Date: parsedEDI.interchangeHeader.dateTime || '',
    header_Time: parsedEDI.interchangeHeader.time || '',
    header_Control_Reference: parsedEDI.interchangeHeader.controlReference || ''
  };
  
  // Process all dates
  const dateObjs = {};
  if (parsedEDI.dates && Array.isArray(parsedEDI.dates)) {
    parsedEDI.dates.forEach((date, index) => {
      const prefix = `date${index + 1}_`;
      dateObjs[`${prefix}Qualifier`] = date.qualifier || '';
      dateObjs[`${prefix}Description`] = date.description || '';
      dateObjs[`${prefix}Date`] = date.date || '';
      dateObjs[`${prefix}Format`] = date.format || '';
    });
  }
  
  // Process all parties
  const partyObjs = {};
  if (parsedEDI.parties && Array.isArray(parsedEDI.parties)) {
    parsedEDI.parties.forEach((party, index) => {
      const prefix = `party${index + 1}_`;
      partyObjs[`${prefix}Type`] = party.partyQualifier || '';
      partyObjs[`${prefix}Description`] = party.qualifierDescription || '';
      partyObjs[`${prefix}ID`] = party.partyId || '';
      partyObjs[`${prefix}Name`] = party.partyName || '';
    });
  }
  
  // Create one row for each line item with all header, date, and party info
  if (parsedEDI.lineItems && Array.isArray(parsedEDI.lineItems)) {
    parsedEDI.lineItems.forEach((item) => {
      const lineItem = {
        line_Number: item.lineNumber || '',
        line_Product_ID: item.productId || '',
        line_Product_ID_Type: item.productIdType || '',
        line_Description: item.description || '',
        line_Quantity: item.quantity || 0,
        line_Unit: item.unit || '',
        line_Price: item.price || 0,
        line_Price_Qualifier: item.priceQualifier || ''
      };
      
      // Combine all information into one flat object
      const flatRow = {
        ...headerObj,
        ...dateObjs,
        ...partyObjs,
        ...lineItem
      };
      
      flattened.push(flatRow);
    });
  }
  
  // If there are no line items, create at least one row with header info
  if (flattened.length === 0) {
    flattened.push({
      ...headerObj,
      ...dateObjs,
      ...partyObjs
    });
  }
  
  return flattened;
}

const parsedEDI = $input.all()[0].json;

// Make sure we have valid data
if (!parsedEDI || !parsedEDI.orderDetails) {
  throw new Error('Invalid EDI data format. Please ensure the input is from the EDI parser.');
}

const flattenedData = transformToFlattened(parsedEDI);

// Return the flattened data
return { json: { data: flattenedData } };