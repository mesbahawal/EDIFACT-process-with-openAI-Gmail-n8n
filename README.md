# Install n8n

- follow instructions at [n8n self hosting](https://docs.n8n.io/hosting/),
- if you want to connect your local files to the n8n `docker` container filesystem, then install n8n using `composer.yaml` in this repository [here](composer.yaml). Created docker container name will be `n8n-dev-container`
	
# Import Workflow template

- navigate to `templates/` folder [here](templates/) and import the `edifact-process.json` file into the installed n8n workflow collections
	
# APIs connections setup

get client codes for below external applications and set them into the n8n's connections manager:

- Gmail oAuth2  
- OpenAI token/key
	
# AI agent System Message/Prompt configuratrion

Copy below prompt into the n8n's OpenAI agent component to read order data from Email (Gmail):
	
```
	You are an assistant that processes emails related to inbound orders from Hermes.

	Each email has the subject line containing a purchase order reference (e.g., "PO45231").
	In the email body, you will find:

	An expected delivery date, typically in formats like 27/03/2025 or 2025-03-27.

	One or more order lines, where each line contains:

	An SKU (e.g., HERM-SHOE-001)

	A quantity (e.g., 120)
	
	Your goal is to extract the following fields:

	purchase_order: The PO number from the subject line (e.g., PO45231)

	expected_delivery_date: In ISO format (e.g., 2025-03-27)

	lines: A list of objects with sku and quantity for each order line

	Return your output strictly as a valid JSON object using the format below.
```
	
# JSON data-format EDI example

## incoming JSON example:
	
```
	{
		"purchase_order": "PO2545",
		"expected_delivery_date": "2025-06-20",
		"lines": [
		  {"sku": "HERM-SHOE-0001", "quantity": 120},
		  {"sku": "HERM-BAG-0001", "quantity": 10}
		]
	}
```
	
## JavaScript code:
	
```
	const{purchase_order, expected_delivery_date, lines} = $input.first().json.output;

	return lines.map( line=> ({
	  json: {
		purchase_order,
		expected_delivery_date,
		sku: line.sku,
		quantity: line.quantity
	  }
	}))
```

# References

- [supply-science](https://n8n.supply-science.com/workflows/Supply_Chain/Electronic_Data_Interchange_(EDI)_Message_Parsing)