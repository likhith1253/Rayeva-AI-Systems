MOCK_ORDERS = {
    "ORD-801": {
        "order_id": "ORD-801",
        "customer_name": "Priyanka Sharma",
        "status": "processing",
        "items": ["Bamboo Toothbrush Set", "Organic Cotton Tote"],
        "total_amount_inr": 1250.00,
        "order_date": "2026-03-01T10:00:00Z",
        "estimated_delivery": "2026-03-08T18:00:00Z",
        "tracking_number": "RAY12345678IN",
        "courier": "EcoCart"
    },
    "ORD-802": {
        "order_id": "ORD-802",
        "customer_name": "Rahul Verma",
        "status": "shipped",
        "items": ["Reusable Silicone Food Bags", "Soy Wax Candle"],
        "total_amount_inr": 2100.00,
        "order_date": "2026-03-02T14:30:00Z",
        "estimated_delivery": "2026-03-09T18:00:00Z",
        "tracking_number": "RAY87654321IN",
        "courier": "GreenLogistics"
    },
    "ORD-803": {
        "order_id": "ORD-803",
        "customer_name": "Anita Desai",
        "status": "delivered",
        "items": ["Hemp Yoga Mat", "Copper Water Bottle"],
        "total_amount_inr": 3450.00,
        "order_date": "2026-02-28T09:15:00Z",
        "estimated_delivery": "2026-03-05T18:00:00Z",
        "tracking_number": "RAY11223344IN",
        "courier": "EcoCart"
    },
    "ORD-804": {
        "order_id": "ORD-804",
        "customer_name": "Karan Singh",
        "status": "cancelled",
        "items": ["Bamboo Cutlery Set"],
        "total_amount_inr": 450.00,
        "order_date": "2026-03-05T11:20:00Z",
        "estimated_delivery": None,
        "tracking_number": None,
        "courier": None
    },
    "ORD-805": {
        "order_id": "ORD-805",
        "customer_name": "Neha Gupta",
        "status": "processing",
        "items": ["Upcycled Denim Laptop Sleeve", "Cork Notebook"],
        "total_amount_inr": 1850.00,
        "order_date": "2026-03-06T16:45:00Z",
        "estimated_delivery": "2026-03-12T18:00:00Z",
        "tracking_number": "RAY55667788IN",
        "courier": "SustainableShip"
    }
}

MOCK_CUSTOMERS = {
    "Priyanka Sharma": "ORD-801",
    "Rahul Verma": "ORD-802",
    "Anita Desai": "ORD-803",
    "Karan Singh": "ORD-804",
    "Neha Gupta": "ORD-805"
}
