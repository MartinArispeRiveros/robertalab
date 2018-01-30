package de.fhg.iais.roberta.syntax.action.nao;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.RobertaProperties;
import de.fhg.iais.roberta.util.Util1;
import de.fhg.iais.roberta.util.test.nao.HelperNaoForTest;

public class WalkTowardsTest {
    HelperNaoForTest h = new HelperNaoForTest(new RobertaProperties(Util1.loadProperties(null)));

    @Test
    public void make_ByDefault_ReturnInstanceOfWalkToClass() throws Exception {
        String expectedResult = "BlockAST [project=[[Location [x=138, y=88], " + "MainTask [], " + "WalkTo [EmptyExpr [defVal=NUMBER_INT], EmptyExpr [defVal=NUMBER_INT], EmptyExpr [defVal=NUMBER_INT]]]]]";
        
        String result = this.h.generateTransformerString("/action/walk_to_missing_coordinates.xml");

        Assert.assertEquals(expectedResult, result);
    }

    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {

        this.h.assertTransformationIsOk("/action/walk_to_missing_coordinates.xml");
    }
}