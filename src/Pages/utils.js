export const getConnectedPairs = (formData) => {
  const pairs = [];
  const visited = new Set();
  formData.joints.forEach((joint) => {
    joint.Span_To.forEach((conn) => {
      const pairKey = [joint.Label, conn].sort().join("-");
      if (!visited.has(pairKey)) {
        pairs.push({
          from: joint.Label,
          to: conn,
          value: "",
          Cross_Section: "Rectangular",
          width: "",
          height: "",
          diameter: "",
          momentOfInertia: 0,
        });
        visited.add(pairKey);
      }
    });
  });
  return pairs;
};

export const calculateStiffnessFactors = (formData) => {
  return formData.spans.map((span, index) => {
    const fromJointIndex = formData.joints.findIndex((j) => j.Label === span.from);
    const toJointIndex = formData.joints.findIndex((j) => j.Label === span.to);
    const fromSupport = formData.supports[fromJointIndex];
    const toSupport = formData.supports[toJointIndex];
    const inertia = parseFloat(formData.momentsOfInertia[index].momentOfInertia);
    const length = parseFloat(span.value);

    let factor;
    if (fromSupport === "Fixed" || toSupport === "Fixed") {
      factor = (4 * inertia) / length;
    } else {
      factor = (4 * inertia) / length;
    }

    return {
      from: span.from,
      to: span.to,
      value: factor,
    };
  });
};

export const calculateDistributionFactors = (formData, stiffnessFactors) => {
  const distributionFactors = [];
  const totalStiffnessAtJoint = {};
  formData.joints.forEach((joint) => {
    totalStiffnessAtJoint[joint.Label] = 0;
  });

  stiffnessFactors.forEach((sf) => {
    totalStiffnessAtJoint[sf.from] += sf.value;
    totalStiffnessAtJoint[sf.to] += sf.value;
  });

  formData.joints.forEach((joint, index) => {
    const supportType = formData.supports[index];
    joint.Span_To.forEach((toLabel) => {
      let dfFromTo;
      if (supportType === "Fixed" || supportType === "NoSupport") {
        dfFromTo = 0;
      } else if (
        (supportType === "Roller" || supportType === "Pin") &&
        joint.Span_To.length === 1
      ) {
        dfFromTo = 1;
      } else {
        const stiffness = stiffnessFactors.find(
          (sf) =>
            (sf.from === joint.Label && sf.to === toLabel) ||
            (sf.to === joint.Label && sf.from === toLabel)
        ).value;
        dfFromTo = stiffness / totalStiffnessAtJoint[joint.Label];
      }

      distributionFactors.push({
        from: joint.Label,
        to: toLabel,
        value: dfFromTo,
      });
    });
  });

  return distributionFactors;
};

export const calculateFixedEndMoments = (formData) => {
  return formData.loads.map((load, index) => {
    const span = formData.spans.find(
      (s) => s.from === load.from && s.to === load.to
    );
    const length = parseFloat(span?.value);
    const weight = parseFloat(load.value);

    let femFromTo = 0;
    let femToFrom = 0;

    if (load.type === "UDL") {
      // UDL covers the entire span
      femFromTo = -((weight * length * length) / 12); // -wL²/12
      femToFrom = (weight * length * length) / 12; // wL²/12
    } else if (load.type === "Point Load") {
      const a = parseFloat(load.distance); // Distance from left (from)
      const b = length - a;

      if (a === b) {
        // Point load at center: PL/8
        const fem = (weight * length) / 8;
        femFromTo = -fem;
        femToFrom = fem;
      } else {
        // Point load at arbitrary position
        femFromTo = -(weight * a * b ** 2) / length ** 2;
        femToFrom = (weight * a ** 2 * b) / length ** 2;
      }
    }

    return {
      from: load.from,
      to: load.to,
      femFromTo: parseFloat(femFromTo.toFixed(3)),
      femToFrom: parseFloat(femToFrom.toFixed(3)),
    };
  });
};