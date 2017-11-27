package de.fhg.iais.roberta.ast.action;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.test.ev3.Helper;

public class SetLanguageTest {
    Helper h = new Helper();

    @Test
    public void make_ByDefault_ReturnInstanceOfSetLanguageAction() throws Exception {
        String expectedResult = "BlockAST [project=[[Location [x=88, y=88], " + "MainTask [], " + "SetLanguage [GERMAN]]]]";

        String result = this.h.generateTransformerString("/ast/actions/action_SetLanguage.xml");

        Assert.assertEquals(expectedResult, result);
    }

    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {

        this.h.assertTransformationIsOk("/ast/actions/action_SetLanguage.xml");
    }
}