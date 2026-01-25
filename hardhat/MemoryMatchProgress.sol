// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MemoryMatchProgress {
    struct Progress {
        uint256[2] levels;
        uint16 total;
        uint32 updated;
    }
    
    mapping(address => Progress) private _p;
    
    event Updated(address indexed player, uint8 level, uint8 stars);
    
    function update(uint8 level, uint8 stars) external {
        require(level > 0 && level <= 100 && stars > 0 && stars <= 3, "Bad input");
        
        Progress storage p = _p[msg.sender];
        uint256 i = level - 1;
        uint256 slot = i / 128;
        uint256 pos = (i % 128) * 2;
        
        uint256 curr = (p.levels[slot] >> pos) & 3;
        
        if (stars > curr) {
            p.levels[slot] = (p.levels[slot] & ~(uint256(3) << pos)) | (uint256(stars) << pos);
            p.total = p.total + uint16(stars) - uint16(curr);
        }
        
        p.updated = uint32(block.timestamp);
        emit Updated(msg.sender, level, stars);
    }
    
    function batchUpdate(uint8[] calldata levels, uint8[] calldata stars) external {
        uint256 len = levels.length;
        require(len == stars.length && len <= 100, "Bad length");
        
        Progress storage p = _p[msg.sender];
        
        for (uint256 j = 0; j < len;) {
            uint8 level = levels[j];
            uint8 star = stars[j];
            require(level > 0 && level <= 100 && star > 0 && star <= 3, "Bad input");
            
            uint256 i = level - 1;
            uint256 slot = i / 128;
            uint256 pos = (i % 128) * 2;
            
            uint256 curr = (p.levels[slot] >> pos) & 3;
            
            if (star > curr) {
                p.levels[slot] = (p.levels[slot] & ~(uint256(3) << pos)) | (uint256(star) << pos);
                p.total = p.total + uint16(star) - uint16(curr);
            }
            
            unchecked { ++j; }
        }
        
        p.updated = uint32(block.timestamp);
    }
    
    function getStars(address player, uint8 level) external view returns (uint8) {
        require(level > 0 && level <= 100, "Bad level");
        uint256 i = level - 1;
        return uint8((_p[player].levels[i / 128] >> ((i % 128) * 2)) & 3);
    }
    
    function getTotal(address player) external view returns (uint16) {
        return _p[player].total;
    }
    
    function getUpdated(address player) external view returns (uint32) {
        return _p[player].updated;
    }
}
