// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../MemoryMatchProgress.sol";

/**
 * @title MemoryMatchProgress Tests
 * @notice Comprehensive test suite for MemoryMatchProgress contract
 * @dev Uses Foundry's testing framework
 */
contract MemoryMatchProgressTest is Test {
    MemoryMatchProgress public progress;
    address public player1;
    address public player2;
    
    event ProgressUpdated(
        address indexed player,
        uint8 level,
        uint8 stars,
        uint16 totalStars
    );
    
    function setUp() public {
        progress = new MemoryMatchProgress();
        player1 = address(0x1);
        player2 = address(0x2);
    }
    
    // ========== Unit Tests ==========
    
    function testUpdateLevelBasic() public {
        vm.prank(player1);
        progress.updateLevel(1, 3);
        
        assertEq(progress.getLevelStars(player1, 1), 3);
        assertTrue(progress.isLevelCompleted(player1, 1));
        assertEq(progress.getTotalStars(player1), 3);
    }
    
    function testUpdateLevelInvalidLevel() public {
        vm.prank(player1);
        vm.expectRevert("Invalid level");
        progress.updateLevel(0, 3);
        
        vm.prank(player1);
        vm.expectRevert("Invalid level");
        progress.updateLevel(101, 3);
    }
    
    function testUpdateLevelInvalidStars() public {
        vm.prank(player1);
        vm.expectRevert("Invalid stars");
        progress.updateLevel(1, 0);
        
        vm.prank(player1);
        vm.expectRevert("Invalid stars");
        progress.updateLevel(1, 4);
    }
    
    function testUpdateLevelOnlyUpdatesBetterStars() public {
        vm.startPrank(player1);
        
        // First update: 2 stars
        progress.updateLevel(1, 2);
        assertEq(progress.getTotalStars(player1), 2);
        
        // Try to update with worse stars (1 star)
        progress.updateLevel(1, 1);
        assertEq(progress.getLevelStars(player1, 1), 2); // Should still be 2
        assertEq(progress.getTotalStars(player1), 2); // Total should not change
        
        // Update with better stars (3 stars)
        progress.updateLevel(1, 3);
        assertEq(progress.getLevelStars(player1, 1), 3); // Should be 3 now
        assertEq(progress.getTotalStars(player1), 3); // Total should increase by 1
        
        vm.stopPrank();
    }
    
    function testBatchUpdateLevels() public {
        uint8[] memory levels = new uint8[](3);
        levels[0] = 1;
        levels[1] = 2;
        levels[2] = 3;
        
        uint8[] memory stars = new uint8[](3);
        stars[0] = 3;
        stars[1] = 2;
        stars[2] = 1;
        
        vm.prank(player1);
        progress.batchUpdateLevels(levels, stars);
        
        assertEq(progress.getLevelStars(player1, 1), 3);
        assertEq(progress.getLevelStars(player1, 2), 2);
        assertEq(progress.getLevelStars(player1, 3), 1);
        assertEq(progress.getTotalStars(player1), 6);
    }
    
    function testBatchUpdateLevelsArrayLengthMismatch() public {
        uint8[] memory levels = new uint8[](3);
        levels[0] = 1;
        levels[1] = 2;
        levels[2] = 3;
        
        uint8[] memory stars = new uint8[](2);
        stars[0] = 3;
        stars[1] = 2;
        
        vm.prank(player1);
        vm.expectRevert("Array length mismatch");
        progress.batchUpdateLevels(levels, stars);
    }
    
    function testBatchUpdateLevelsTooManyLevels() public {
        uint8[] memory levels = new uint8[](101);
        uint8[] memory stars = new uint8[](101);
        
        for (uint i = 0; i < 101; i++) {
            levels[i] = uint8(i + 1);
            stars[i] = 3;
        }
        
        vm.prank(player1);
        vm.expectRevert("Too many levels");
        progress.batchUpdateLevels(levels, stars);
    }
    
    function testProgressIsolation() public {
        // Player 1 updates their progress
        vm.prank(player1);
        progress.updateLevel(1, 3);
        
        // Player 2 updates their progress
        vm.prank(player2);
        progress.updateLevel(1, 2);
        
        // Verify each player has their own progress
        assertEq(progress.getLevelStars(player1, 1), 3);
        assertEq(progress.getLevelStars(player2, 1), 2);
        assertEq(progress.getTotalStars(player1), 3);
        assertEq(progress.getTotalStars(player2), 2);
    }
    
    function testEventEmission() public {
        vm.prank(player1);
        
        vm.expectEmit(true, false, false, true);
        emit ProgressUpdated(player1, 1, 3, 3);
        
        progress.updateLevel(1, 3);
    }
    
    function testGetCompletedLevelsCount() public {
        vm.startPrank(player1);
        
        progress.updateLevel(1, 3);
        progress.updateLevel(2, 2);
        progress.updateLevel(3, 1);
        
        assertEq(progress.getCompletedLevelsCount(player1), 3);
        
        vm.stopPrank();
    }
    
    function testGetLastUpdated() public {
        vm.prank(player1);
        progress.updateLevel(1, 3);
        
        uint32 lastUpdated = progress.getLastUpdated(player1);
        assertGt(lastUpdated, 0);
        assertEq(lastUpdated, block.timestamp);
    }
    
    // ========== Property Tests ==========
    
    /**
     * Property 17: Single Level Update
     * For any valid level number (1-100) and star rating (1-3),
     * the updateLevel function should successfully update the player's progress.
     * 
     * Validates: Requirements 19.4
     * Feature: memory-match-base, Property 17: Single Level Update
     */
    function testFuzz_Property17_SingleLevelUpdate(uint8 level, uint8 stars) public {
        // Constrain inputs to valid ranges
        vm.assume(level >= 1 && level <= 100);
        vm.assume(stars >= 1 && stars <= 3);
        
        vm.prank(player1);
        progress.updateLevel(level, stars);
        
        // Verify update succeeded
        assertEq(progress.getLevelStars(player1, level), stars);
        assertTrue(progress.isLevelCompleted(player1, level));
        assertGe(progress.getTotalStars(player1), stars);
    }
    
    /**
     * Property 18: Batch Level Update
     * For any array of valid level numbers and corresponding star ratings,
     * the batchUpdateLevels function should successfully update all levels.
     * 
     * Validates: Requirements 19.5
     * Feature: memory-match-base, Property 18: Batch Level Update
     */
    function testFuzz_Property18_BatchLevelUpdate(uint8 numLevels) public {
        // Constrain to reasonable number of levels (1-20 for testing)
        vm.assume(numLevels >= 1 && numLevels <= 20);
        
        uint8[] memory levels = new uint8[](numLevels);
        uint8[] memory stars = new uint8[](numLevels);
        
        for (uint8 i = 0; i < numLevels; i++) {
            levels[i] = i + 1; // Levels 1 to numLevels
            stars[i] = uint8((i % 3) + 1); // Stars 1-3
        }
        
        vm.prank(player1);
        progress.batchUpdateLevels(levels, stars);
        
        // Verify all levels were updated
        for (uint8 i = 0; i < numLevels; i++) {
            assertEq(progress.getLevelStars(player1, levels[i]), stars[i]);
            assertTrue(progress.isLevelCompleted(player1, levels[i]));
        }
    }
    
    /**
     * Property 19: Progress Isolation
     * For any player address, that player should only be able to modify
     * their own progress data.
     * 
     * Validates: Requirements 19.8
     * Feature: memory-match-base, Property 19: Progress Isolation
     */
    function testFuzz_Property19_ProgressIsolation(
        address playerA,
        address playerB,
        uint8 level,
        uint8 starsA,
        uint8 starsB
    ) public {
        // Constrain inputs
        vm.assume(playerA != address(0) && playerB != address(0));
        vm.assume(playerA != playerB);
        vm.assume(level >= 1 && level <= 100);
        vm.assume(starsA >= 1 && starsA <= 3);
        vm.assume(starsB >= 1 && starsB <= 3);
        
        // Player A updates their progress
        vm.prank(playerA);
        progress.updateLevel(level, starsA);
        
        // Player B updates their progress
        vm.prank(playerB);
        progress.updateLevel(level, starsB);
        
        // Verify each player has their own progress
        assertEq(progress.getLevelStars(playerA, level), starsA);
        assertEq(progress.getLevelStars(playerB, level), starsB);
        
        // Verify one player's update didn't affect the other
        if (starsA != starsB) {
            assertTrue(progress.getLevelStars(playerA, level) != progress.getLevelStars(playerB, level));
        }
    }
    
    /**
     * Property 20: Progress Update Event Emission
     * For any successful progress update transaction, the contract should
     * emit a ProgressUpdated event with correct data.
     * 
     * Validates: Requirements 18.5, 19.7
     * Feature: memory-match-base, Property 20: Progress Update Event Emission
     */
    function testFuzz_Property20_EventEmission(
        address player,
        uint8 level,
        uint8 stars
    ) public {
        // Constrain inputs
        vm.assume(player != address(0));
        vm.assume(level >= 1 && level <= 100);
        vm.assume(stars >= 1 && stars <= 3);
        
        vm.prank(player);
        
        // Expect event to be emitted
        vm.expectEmit(true, false, false, true);
        emit ProgressUpdated(player, level, stars, stars);
        
        progress.updateLevel(level, stars);
    }
    
    /**
     * Property: Star Maximization
     * When updating a level multiple times, only the highest star rating
     * should be kept.
     */
    function testFuzz_StarMaximization(
        uint8 level,
        uint8 stars1,
        uint8 stars2
    ) public {
        vm.assume(level >= 1 && level <= 100);
        vm.assume(stars1 >= 1 && stars1 <= 3);
        vm.assume(stars2 >= 1 && stars2 <= 3);
        
        vm.startPrank(player1);
        
        // First update
        progress.updateLevel(level, stars1);
        uint16 totalAfterFirst = progress.getTotalStars(player1);
        
        // Second update
        progress.updateLevel(level, stars2);
        uint8 finalStars = progress.getLevelStars(player1, level);
        uint16 totalAfterSecond = progress.getTotalStars(player1);
        
        vm.stopPrank();
        
        // Final stars should be the maximum of the two
        assertEq(finalStars, stars1 > stars2 ? stars1 : stars2);
        
        // Total stars should reflect the maximum
        if (stars2 > stars1) {
            assertEq(totalAfterSecond, totalAfterFirst + (stars2 - stars1));
        } else {
            assertEq(totalAfterSecond, totalAfterFirst);
        }
    }
    
    /**
     * Property: Total Stars Consistency
     * The total stars should always equal the sum of all level stars.
     */
    function testFuzz_TotalStarsConsistency(uint8 numLevels) public {
        vm.assume(numLevels >= 1 && numLevels <= 20);
        
        uint16 expectedTotal = 0;
        
        vm.startPrank(player1);
        
        for (uint8 i = 0; i < numLevels; i++) {
            uint8 level = i + 1;
            uint8 stars = uint8((i % 3) + 1);
            
            progress.updateLevel(level, stars);
            expectedTotal += stars;
        }
        
        vm.stopPrank();
        
        assertEq(progress.getTotalStars(player1), expectedTotal);
    }
}
