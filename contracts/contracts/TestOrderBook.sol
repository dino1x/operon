// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TestOrderBook
 * @notice High-throughput onchain limit orderbook demonstrating parallel execution on Monad.
 * @dev Supports atomic limit order placement, batch submissions, and zero-lock execution.
 */
contract TestOrderBook {
    struct Order {
        uint256 orderId;
        address trader;
        bool isBuy; // true = Buy, false = Sell
        uint256 price; // Price in native MON (e.g., 2500 for $25.00)
        uint256 amount; // Token quantity
        uint256 filled;
        uint256 createdAt;
        bool isActive;
    }

    struct OrderParams {
        bool isBuy;
        uint256 price;
        uint256 amount;
    }

    uint256 private _orderIdCounter;
    mapping(uint256 => Order) public orders;
    uint256[] public activeOrderIds;

    uint256 public totalOrdersPlaced;
    uint256 public totalVolumeTraded;

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        bool isBuy,
        uint256 price,
        uint256 amount,
        uint256 blockNumber
    );
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event OrderFilled(
        uint256 indexed orderId,
        address indexed taker,
        uint256 fillAmount,
        uint256 executionPrice
    );

    receive() external payable {}

    /**
     * @notice Places a single limit order on the book
     */
    function placeLimitOrder(
        bool isBuy,
        uint256 price,
        uint256 amount
    ) external payable returns (uint256) {
        require(price > 0, "TestOrderBook: Price must be > 0");
        require(amount > 0, "TestOrderBook: Amount must be > 0");

        _orderIdCounter++;
        uint256 orderId = _orderIdCounter;

        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            isBuy: isBuy,
            price: price,
            amount: amount,
            filled: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        activeOrderIds.push(orderId);
        totalOrdersPlaced++;
        totalVolumeTraded += (price * amount);

        emit OrderPlaced(orderId, msg.sender, isBuy, price, amount, block.number);
        return orderId;
    }

    /**
     * @notice Places multiple limit orders concurrently (demonstrates Monad parallel processing)
     */
    function placeBatchOrders(
        OrderParams[] calldata batch
    ) external payable returns (uint256[] memory) {
        uint256[] memory placedIds = new uint256[](batch.length);

        for (uint256 i = 0; i < batch.length; i++) {
            _orderIdCounter++;
            uint256 orderId = _orderIdCounter;

            orders[orderId] = Order({
                orderId: orderId,
                trader: msg.sender,
                isBuy: batch[i].isBuy,
                price: batch[i].price,
                amount: batch[i].amount,
                filled: 0,
                createdAt: block.timestamp,
                isActive: true
            });

            activeOrderIds.push(orderId);
            totalOrdersPlaced++;
            totalVolumeTraded += (batch[i].price * batch[i].amount);
            placedIds[i] = orderId;

            emit OrderPlaced(
                orderId,
                msg.sender,
                batch[i].isBuy,
                batch[i].price,
                batch[i].amount,
                block.number
            );
        }

        return placedIds;
    }

    /**
     * @notice Cancels an active order
     */
    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.isActive, "TestOrderBook: Order not active");
        require(order.trader == msg.sender, "TestOrderBook: Not your order");

        order.isActive = false;
        emit OrderCancelled(orderId, msg.sender);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getActiveOrderCount() external view returns (uint256) {
        return activeOrderIds.length;
    }
}
