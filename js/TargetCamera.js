TargetCamera = function( fov, aspect, near, far ) {
    THREE.Camera.call( this );

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.targets = {};
    this.currentTargetName = null;

    // A helper Object3D. Used to help position the camera based on the 
    // two position settings above.
    this._idealObject = new THREE.Object3D();

    this._isTransitioning = false;

    // Default target settings.
    this._defaults = {
        name: null,
        targetObject: new THREE.Object3D(),
        cameraPosition: new THREE.Vector3(0, 30, 50),
        cameraRotation: undefined,
        fixed: false,
        stiffness: 0.4,
        matchRotation: true
    };

    this.updateProjectionMatrix();
};

TargetCamera.prototype = Object.create( THREE.PerspectiveCamera.prototype );

TargetCamera.prototype._translateIdealObject = function( vec ) {
    var obj = this._idealObject;

    if( vec.x !== 0 ) {
        obj.translateX( vec.x );
    }

    if( vec.y !== 0 ) {
        obj.translateY( vec.y );
    }

    if( vec.z !== 0 ) {
        obj.translateZ( vec.z );
    }
};

TargetCamera.prototype._createNewTarget = function() {
    var defaults = this._defaults;

    return {
        name: defaults.name,
        targetObject: defaults.targetObject,
        cameraPosition: defaults.cameraPosition,
        cameraRotation: defaults.cameraRotation,
        fixed: defaults.fixed,
        stiffness: defaults.stiffness,
        matchRotation: defaults.matchRotation
    };
};

TargetCamera.prototype._determineCameraRotation = function( rotation ) {
    if( rotation instanceof THREE.Euler ) {
        return new THREE.Quaternion().setFromEuler( rotation );
    }
    else if( rotation instanceof THREE.Quaternion ) {
        return rotation;
    }
    else {
        return undefined;
    }
};

TargetCamera.prototype.addTarget = function( settings ) {
    var target = this._createNewTarget();

    if( typeof settings === 'object' ) {
        for( var i in settings ) {
            if( target.hasOwnProperty( i ) ) {
                if( i === 'cameraRotation' ) {
                    target[ i ] = this._determineCameraRotation( settings[ i ] );
                }
                else {
                    target[ i ] = settings[ i ];
                }
            }
        }
    }

    this.targets[ settings.name ] = target;
};

TargetCamera.prototype.setTarget = function( name ) {
    if( this.targets.hasOwnProperty( name ) ) {
        this.currentTargetName = name;
    }
    else {
        console.warn( 'No target with name ' + name );
    }
};

TargetCamera.prototype.update = function( dt ) {
    var target = this.targets[ this.currentTargetName ],
		ideal = this._idealObject;

    if( !target ) return;
	ideal.position.copy( target.targetObject.position );
	ideal.quaternion.copy( target.targetObject.quaternion );

	if( target.cameraRotation !== undefined ) {
		ideal.quaternion.multiply( target.cameraRotation );
	}

	this._translateIdealObject( target.cameraPosition );
	this.position.lerp( ideal.position, target.stiffness );

	if( target.matchRotation ) {
		this.quaternion.slerp( ideal.quaternion, target.stiffness );
	}
	else {
		this.lookAt( target.targetObject.position );
	}
};