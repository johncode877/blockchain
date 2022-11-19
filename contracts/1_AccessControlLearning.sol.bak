// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
    Desarrollar un sistema complejo de control de accesos. Seguir las instrucciones:
    Cada cuenta puede tener uno o más roles. Los roles se pueden repetir en varias cuentas.
*/


contract AccessControlLearning {
    
     struct Usuario {
      uint256 limit;
      bool hasRole;
    }

    // 0. Definir el rol de admin con el cual se inicializa el smart contract
    
    // |           | MINTER | BURNER | PAUSER |
    // | --------- | ------ | ------ | ------ |
    // | Account 1 | True   | True   | True   |
    // | Account 2 | True   | False  | True   |
    // | Account 3 | False  | False  | True   |
    // |   ...     |   ...  |  ...   |  ...   |

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // 1. definir un mapping doble para guardar una matriz de información.
    //  El mapping debe ser 'private'
    //mapping 1 -> address => role
    //mapping 2 -> role => boolean
    //mapping(address => mapping(bytes32 => bool)) roles;

    mapping(address => mapping(bytes32 => Usuario)) private roles;

    //5. utilizar el constructor para inicializar valores
    constructor() {

        Usuario memory usuario = Usuario({
          limit: 0,
          hasRole: true
        });
        roles[msg.sender][DEFAULT_ADMIN_ROLE] = usuario;
        //roles[msg.sender][MINTER_ROLE] = true;
        //roles[msg.sender][BURNER_ROLE] = true;
        //roles[msg.sender][PAUSER_ROLE] = true;
    }

    //  2. definir metodo de lectura de datos de la matriz
    function hasRole(address _account, bytes32 role) public view returns(bool){
        Usuario memory usuario = roles[_account][role];
        return usuario.hasRole;
    }     

    // 3. definir método para escribir datos en la matriz
    //    grantRole
    //    mapping[accout 1][MINTER] = true
    //    mapping[accout 1][BURNER] = true
    //    mapping[accout 1][PAUSER] = true
    //    mapping[accout 2][MINTER] = true
    //    mapping[accout 2][PAUSER] = true
    //    mapping[accout 3][PAUSER] = true
    function grantRole(address _account, bytes32 role) public onlyRole(DEFAULT_ADMIN_ROLE) {
        Usuario storage usuario = roles[_account][role];
        usuario.hasRole = true;
    }

    // 4. crear modifier que verifica el acceso de los roles
    modifier onlyRole(bytes32 _role) {
        Usuario memory usuario = roles[msg.sender][_role];
        bool _hasRole = usuario.hasRole;
        require(_hasRole, "Cuenta no tiene el rol necesario");
        _;
    }
    
    // 6. Crear un método que se llame 'transferOwnership(address _newOwner)'
    //   Recibe un argumento: el address del nuevo owner
    //   Solo Puede ser llamado por una cuenta admin
    //   La cuenta admin transfiere sus derechos de admin a '_newOwner'
    //   Dispara el evento 'TransferOwnership(address _prevOwner, address _newOwner)'

    function transferOwnership(address _newOwner) public onlyRole(DEFAULT_ADMIN_ROLE){

        require( _newOwner!=address(0) || _newOwner!=msg.sender  ,"address invalido"); 
        
        roles[_newOwner][DEFAULT_ADMIN_ROLE].hasRole=true;
        roles[msg.sender][DEFAULT_ADMIN_ROLE].hasRole=false;
        emit TransferOwnership(msg.sender, _newOwner);
    }

    event TransferOwnership(address _prevOwner, address _newOwner);

    // 7. Crear un método llamado 'renounceOwnership'
    //   La cuenta que lo llama es una cuenta admin
    //   Esta cuenta renuncia su derecho a ser admin
    //   Dispara un evento RenounceOwnership(msg.sender)

    function renounceOwnership() public onlyRole(DEFAULT_ADMIN_ROLE){
        require( msg.sender!=address(0)  ,"address invalido"); 
        roles[msg.sender][DEFAULT_ADMIN_ROLE].hasRole=false;
        emit RenounceOwnership(msg.sender);
    } 

    event RenounceOwnership(address _owner);
    
    //8. Crear un método llamado 'grantRoleTemporarily'
    //   Le asigna un rol determinado a una cuenta por una cantidad 'N' de veces
    //   Dicha cuenta solo puede llamar métodos del tipo rol '_role' hasta 'N'
    //   function grantRoleTemporarily(address _account, bytes32 _role, uint256 _limit)
    //   El argumento '_limit' es mayor a uno - require
    
    
    //mapping(address => mapping(bytes32 => uint256)) rolesTemporarily;

    function grantRoleTemporarily(
         address _account, 
         bytes32 _role, 
         uint256 _limit
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {         
         require(_limit > 1 ,"limite invalido");
         Usuario storage usuario = roles[_account][_role];         
         usuario.hasRole = true;
         usuario.limit = _limit;
    }


    // 9. Definir su getter llamado 'hasTemporaryRole(address _account, bytes32 _role) returns (bool, uint256)'
    //   Retorna dos valores:
    //    - indica si dicha cuenta tiene una rol temporal: true/false
    //    - indica la cantidad de veces restantes que puede llamar métodos del tipo rol '_role'
    //    - si no tiene rol temporal, devolver (false, 0)

    function hasTemporaryRole(address _account, bytes32 _role) 
        public 
        returns (bool, uint256){
        Usuario storage usuario = roles[_account][_role];

        uint256 _limit = usuario.limit;
        bool _hasRole = usuario.hasRole;
        
        uint256 _limitNew=_limit-1;
        _limitNew = _limitNew>0?_limitNew:0;
        usuario.limit = _limitNew;
        _hasRole= _limitNew>0;
        usuario.hasRole = _hasRole;

        /*
        if((_limit<=0) && !_hasRole){
            return (false,0);        
        }
        
        _limit--;
        _limit = _limit>0?_limit:0;
        rolesTemporarily[_account][_role] = _limit;
        if((_hasRole)&&(_limit<=0)){
          _hasRole = false;
          roles[_account][_role] = _hasRole;
        }
        */
        return (_hasRole,_limit);       
    }

}

